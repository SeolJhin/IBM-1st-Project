package org.myweb.uniplace.domain.contract.application;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.myweb.uniplace.domain.contract.domain.entity.Contract;
import org.myweb.uniplace.domain.user.domain.entity.User;
import org.myweb.uniplace.domain.file.api.dto.request.FileUploadRequest;
import org.myweb.uniplace.domain.file.api.dto.response.FileResponse;
import org.myweb.uniplace.domain.file.api.dto.response.FileUploadResponse;
import org.myweb.uniplace.domain.file.application.FileService;
import org.myweb.uniplace.domain.file.domain.enums.FileRefType;
import org.myweb.uniplace.domain.property.domain.entity.Building;
import org.myweb.uniplace.domain.property.domain.entity.Room;
import org.myweb.uniplace.global.config.UploadProperties;
import org.myweb.uniplace.global.storage.StorageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContractImageServiceImpl implements ContractImageService {

    private final FileService fileService;
    private final ObjectMapper objectMapper;
    private final StorageService storageService;   // ← 추가: 로컬/S3 겸용 읽기에 사용
    private final UploadProperties uploadProperties; // ← 추가: 로컬 여부 판단용

    @Value("${contract.template-path:./src/main/resources/contracts/contract_template.png}")
    private String templatePath;

    @Value("${contract.python-path:python}")
    private String pythonPath;

    @Value("${contract.script-path:./src/main/resources/contracts/generate_contract.py}")
    private String scriptPath;

    @Value("${contract.temp-dir:./storage/tmp}")
    private String tempDir;

    // ※ uploadBasePath는 로컬 모드 전용이므로 삭제하고 UploadProperties를 통해 접근합니다.
    //   S3 모드에서 이 필드를 직접 참조하면 C:/uniplace/uploads 기본값으로 항상 파일을 못 찾습니다.

    /**
     * 서버 시작 시 호출.
     * templatePath / scriptPath 가 파일시스템에 없으면
     * classpath:contracts/ 에서 꺼내 같은 경로에 복사.
     * → 로컬: src/main/resources/contracts/ 직접 접근
     * → 배포: jar 내부 classpath 에서 추출하여 파일시스템에 배치
     */
    @PostConstruct
    public void extractContractResourcesIfNeeded() {
        extractIfMissing(templatePath, "contracts/contract_template.png");
        extractIfMissing(scriptPath,   "contracts/generate_contract.py");
    }

    private void extractIfMissing(String configuredPath, String classpathLocation) {
        if (configuredPath == null || configuredPath.isBlank()) return;
        Path target = Paths.get(configuredPath).toAbsolutePath().normalize();
        if (target.toFile().exists()) return; // 이미 있으면 스킵

        try {
            ClassPathResource res = new ClassPathResource(classpathLocation);
            if (!res.exists()) {
                log.warn("[ContractImage] classpath 리소스 없음: {}", classpathLocation);
                return;
            }
            Files.createDirectories(target.getParent());
            try (InputStream is = res.getInputStream()) {
                Files.copy(is, target, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("[ContractImage] 리소스 추출 완료: {} → {}", classpathLocation, target);
        } catch (Exception e) {
            log.warn("[ContractImage] 리소스 추출 실패: {} - {}", classpathLocation, e.getMessage());
        }
    }

    @Override
    public Integer generateAndSave(Contract contract) {
        if (!isConfigured()) {
            log.warn("[ContractImage] 설정 미완료 - template={}, script={}", templatePath, scriptPath);
            return null;
        }

        Path outputPath = null;
        Path dataFilePath = null;
        Path tmpSignPath = null; // S3에서 내려받은 서명 이미지 임시 경로
        try {
            Path tempDirPath = Paths.get(tempDir).toAbsolutePath().normalize();
            Files.createDirectories(tempDirPath);

            String base = "contract_" + contract.getContractId() + "_" + System.currentTimeMillis();
            outputPath   = tempDirPath.resolve(base + ".jpg");
            dataFilePath = tempDirPath.resolve(base + "_data.json");

            Map<String, String> dataMap = buildDataMap(contract);
            String dataJson = objectMapper.writeValueAsString(dataMap);
            Files.writeString(dataFilePath, dataJson, StandardCharsets.UTF_8);

            // ── 수정된 서명 이미지 경로 해석 ──────────────────────────────
            // 로컬: 디스크에서 직접 경로 반환
            // S3:   S3에서 /tmp에 임시 다운로드 후 경로 반환 → Python 스크립트에 전달
            String[] signResult = resolveSignImagePath(contract, tempDirPath, base);
            String signImgPath = signResult[0];
            tmpSignPath = signResult[1] != null ? Paths.get(signResult[1]) : null;
            // ──────────────────────────────────────────────────────────────

            if (!runPythonScript(outputPath.toString(), dataFilePath.toString(), signImgPath)) {
                return null;
            }

            byte[] imgBytes = Files.readAllBytes(outputPath);
            String originalName = "contract_" + contract.getContractId() + ".jpg";
            MultipartFile multipart = new ByteArrayMultipartFile(imgBytes, originalName, "image/jpeg");

            FileUploadResponse resp = fileService.uploadFiles(
                    FileUploadRequest.builder()
                            .fileParentType(FileRefType.CONTRACT.dbValue())
                            .fileParentId(contract.getContractId())
                            .files(List.of(multipart))
                            .build()
            );

            List<FileResponse> files = resp != null ? resp.getFiles() : null;
            if (files != null && !files.isEmpty()) {
                int fileId = files.get(0).getFileId();
                log.info("[ContractImage] 계약 #{} 이미지 저장 완료 fileId={}", contract.getContractId(), fileId);
                return fileId;
            }

        } catch (Exception e) {
            log.error("[ContractImage] 계약서 이미지 생성 오류 contractId={}", contract.getContractId(), e);
        } finally {
            if (outputPath  != null) try { Files.deleteIfExists(outputPath);  } catch (IOException ignored) {}
            if (dataFilePath != null) try { Files.deleteIfExists(dataFilePath); } catch (IOException ignored) {}
            if (tmpSignPath  != null) try { Files.deleteIfExists(tmpSignPath);  } catch (IOException ignored) {}
        }
        return null;
    }

    // ── 내부 MultipartFile 구현 ───────────────────────────────────
    private static class ByteArrayMultipartFile implements MultipartFile {
        private final byte[] content;
        private final String name;
        private final String contentType;

        ByteArrayMultipartFile(byte[] content, String name, String contentType) {
            this.content = content; this.name = name; this.contentType = contentType;
        }
        @Override public String getName()             { return name; }
        @Override public String getOriginalFilename() { return name; }
        @Override public String getContentType()      { return contentType; }
        @Override public boolean isEmpty()            { return content.length == 0; }
        @Override public long getSize()               { return content.length; }
        @Override public byte[] getBytes()            { return content; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(content); }
        @Override public void transferTo(File dest) throws IOException {
            try (FileOutputStream fos = new FileOutputStream(dest)) { fos.write(content); }
        }
    }

    // ── private helpers ──────────────────────────────────────────

    private boolean isConfigured() {
        if (templatePath == null || templatePath.isBlank()) {
            log.warn("[ContractImage] contract.template-path 미설정");
            return false;
        }
        if (scriptPath == null || scriptPath.isBlank()) {
            log.warn("[ContractImage] contract.script-path 미설정");
            return false;
        }
        Path tpl = Paths.get(templatePath).toAbsolutePath().normalize();
        Path scr = Paths.get(scriptPath).toAbsolutePath().normalize();
        if (!tpl.toFile().exists()) {
            log.warn("[ContractImage] 템플릿 파일 없음: {}", tpl);
            return false;
        }
        if (!scr.toFile().exists()) {
            log.warn("[ContractImage] 스크립트 파일 없음: {}", scr);
            return false;
        }
        return true;
    }

    /**
     * 서명 이미지 경로 해석.
     * 로컬: 디스크 경로를 그대로 반환
     * S3:   storageService.read()로 임시 파일에 저장 후 그 경로를 반환
     *
     * @return [signImgPath, tmpFilePath]
     *   signImgPath — Python 스크립트에 전달할 경로 (null이면 서명 없음)
     *   tmpFilePath — finally에서 삭제할 임시 파일 경로 (로컬이면 null)
     */
    private String[] resolveSignImagePath(Contract contract, Path tempDirPath, String base) {
        Integer signFileId = contract.getLessorSignFileId();
        if (signFileId == null) return new String[]{null, null};

        try {
            FileResponse fr = fileService.getFile(signFileId);
            if (fr == null) return new String[]{null, null};

            if (uploadProperties.isS3()) {
                // S3 모드: storageService.read()로 스트림을 가져와 /tmp에 저장
                Path tmpSign = tempDirPath.resolve(base + "_sign.jpg");
                try (InputStream is = storageService.read(fr.getFilePath(), fr.getRenameFilename())) {
                    Files.copy(is, tmpSign, StandardCopyOption.REPLACE_EXISTING);
                }
                return new String[]{tmpSign.toString(), tmpSign.toString()};
            } else {
                // 로컬 모드: 디스크에서 직접 경로 확인 (기존 동작 유지)
                Path p = Paths.get(uploadProperties.getUploadDir())
                        .resolve(fr.getFilePath())
                        .resolve(fr.getRenameFilename());
                return p.toFile().exists()
                        ? new String[]{p.toString(), null}
                        : new String[]{null, null};
            }
        } catch (Exception e) {
            log.warn("[ContractImage] 서명 이미지 경로 조회 실패: {}", e.getMessage());
            return new String[]{null, null};
        }
    }

    private Map<String, String> buildDataMap(Contract contract) {
        Room room = contract.getRoom();
        Building building = room != null ? room.getBuilding() : null;
        Map<String, String> m = new HashMap<>();

        m.put("building_addr", safe(building != null ? building.getBuildingAddr() : ""));
        m.put("land_category",  safe(building != null ? building.getLandCategory() : ""));
        m.put("building_usage", safe(building != null ? building.getBuildingUsage() : ""));
        m.put("room_no",       safe(room != null ? String.valueOf(room.getRoomNo()) : ""));
        m.put("room_size",     room != null && room.getRoomSize() != null
                ? room.getRoomSize().stripTrailingZeros().toPlainString() : "");
        m.put("deposit",     fmtMoney(contract.getDeposit()));
        m.put("rent_price",  fmtMoney(contract.getRentPrice()));
        m.put("manage_fee",  fmtMoney(contract.getManageFee()));
        m.put("payment_day", contract.getPaymentDay() != null
                ? String.valueOf(contract.getPaymentDay()) : "");

        m.putAll(splitDate("deliver", contract.getContractStart()));
        m.putAll(splitDate("end",     contract.getContractEnd()));

        LocalDate signDate = contract.getSignAt() != null
                ? contract.getSignAt().toLocalDate() : LocalDate.now();
        m.putAll(splitDate("sign", signDate));

        m.put("building_lessor_nm",   safe(building != null ? building.getBuildingLessorNm() : ""));
        m.put("building_lessor_tel",  safe(building != null ? building.getBuildingLessorTel() : ""));
        m.put("building_lessor_addr", safe(building != null ? building.getBuildingLessorAddr() : ""));
        m.put("building_lessor_rrn",  maskRrn(building != null ? building.getBuildingLessorRrn() : ""));

        m.put("lessor_nm",   safe(contract.getLessorNm()));
        m.put("lessor_tel",  safe(contract.getLessorTel()));
        m.put("lessor_addr", safe(contract.getLessorAddr()));
        m.put("lessor_rrn",  maskRrn(contract.getLessorRrn()));

        return m;
    }

    private Map<String, String> splitDate(String prefix, LocalDate date) {
        Map<String, String> m = new HashMap<>();
        if (date == null) {
            m.put(prefix + "_year", ""); m.put(prefix + "_month", ""); m.put(prefix + "_day", "");
            return m;
        }
        m.put(prefix + "_year",  date.format(DateTimeFormatter.ofPattern("yyyy")));
        m.put(prefix + "_month", date.format(DateTimeFormatter.ofPattern("MM")));
        m.put(prefix + "_day",   date.format(DateTimeFormatter.ofPattern("dd")));
        return m;
    }

    private String fmtMoney(BigDecimal v) { return v == null ? "" : String.format("%,.0f", v); }
    private String safe(String s)          { return s != null ? s : ""; }
    private String maskRrn(String rrn) {
        if (rrn == null || rrn.isBlank()) return "";
        return rrn.length() >= 8 ? rrn.substring(0, 8) + "******" : rrn;
    }

    private boolean runPythonScript(String outputPath, String dataFilePath, String signImgPath)
            throws IOException, InterruptedException {

        List<String> cmd = new ArrayList<>(List.of(
                pythonPath,
                Paths.get(scriptPath).toAbsolutePath().normalize().toString(),
                "--template", Paths.get(templatePath).toAbsolutePath().normalize().toString(),
                "--output",   outputPath,
                "--data_file", dataFilePath
        ));
        if (signImgPath != null) { cmd.add("--sign_img"); cmd.add(signImgPath); }

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.environment().put("PYTHONIOENCODING", "utf-8");
        pb.redirectErrorStream(false);

        Process proc = pb.start();
        String stdout = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stderr = new String(proc.getErrorStream().readAllBytes(), StandardCharsets.UTF_8);
        int exit = proc.waitFor();

        if (!stderr.isBlank()) log.warn("[ContractImage] Python stderr: {}", stderr.trim());
        if (exit != 0) { log.error("[ContractImage] Python 실패 exit={} stdout={}", exit, stdout); return false; }
        return stdout.trim().startsWith("OK:");
    }
}