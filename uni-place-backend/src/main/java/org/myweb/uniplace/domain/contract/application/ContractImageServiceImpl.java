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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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

    @Value("${contract.template-path:}")
    private String templatePath;

    @Value("${contract.python-path:python}")
    private String pythonPath;

    @Value("${contract.script-path:}")
    private String scriptPath;

    @Value("${contract.temp-dir:C:/uniplace/temp}")
    private String tempDir;

    @Value("${file.upload-path:C:/uniplace/uploads}")
    private String uploadBasePath;

    @Override
    public Integer generateAndSave(Contract contract) {
        if (!isConfigured()) {
            log.warn("[ContractImage] 설정 미완료 - template={}, script={}", templatePath, scriptPath);
            return null;
        }

        Path outputPath = null;
        Path dataFilePath = null;
        try {
            Path tempDirPath = Paths.get(tempDir);
            Files.createDirectories(tempDirPath);

            String base = "contract_" + contract.getContractId() + "_" + System.currentTimeMillis();
            outputPath  = tempDirPath.resolve(base + ".jpg");
            // ✅ JSON을 파일로 저장 → 인수 길이/인코딩 문제 완전 우회
            dataFilePath = tempDirPath.resolve(base + "_data.json");

            Map<String, String> dataMap = buildDataMap(contract);
            String dataJson = objectMapper.writeValueAsString(dataMap);
            Files.writeString(dataFilePath, dataJson, StandardCharsets.UTF_8);

            String signImgPath = resolveSignImagePath(contract);

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
            // 임시 파일 정리
            if (outputPath != null)  try { Files.deleteIfExists(outputPath);  } catch (IOException ignored) {}
            if (dataFilePath != null) try { Files.deleteIfExists(dataFilePath); } catch (IOException ignored) {}
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
        return templatePath != null && !templatePath.isBlank()
                && scriptPath != null && !scriptPath.isBlank()
                && Paths.get(templatePath).toFile().exists()
                && Paths.get(scriptPath).toFile().exists();
    }

    private Map<String, String> buildDataMap(Contract contract) {
        Room room = contract.getRoom();
        Building building = room != null ? room.getBuilding() : null;
        Map<String, String> m = new HashMap<>();

        m.put("building_addr", safe(building != null ? building.getBuildingAddr() : ""));
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

        // ✅ 임대인 정보: Building 엔티티 (건물주)
        m.put("lessor_nm",   safe(building != null ? building.getBuildingLessorNm() : ""));
        m.put("lessor_tel",  safe(building != null ? building.getBuildingLessorTel() : ""));
        m.put("lessor_addr", safe(building != null ? building.getBuildingLessorAddr() : ""));
        m.put("lessor_rrn",  maskRrn(building != null ? building.getBuildingLessorRrn() : ""));

        // ✅ 임차인 정보: Contract.lessor* 컬럼 (회원이 입력한 임차인 본인 정보)
        m.put("lessee_nm",   safe(contract.getLessorNm()));
        m.put("lessee_tel",  safe(contract.getLessorTel()));
        m.put("lessee_addr", safe(contract.getLessorAddr()));
        m.put("lessee_rrn",  maskRrn(contract.getLessorRrn()));

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

    private String resolveSignImagePath(Contract contract) {
        Integer signFileId = contract.getLessorSignFileId();
        if (signFileId == null) return null;
        try {
            FileResponse fr = fileService.getFile(signFileId);
            if (fr == null) return null;
            Path p = Paths.get(uploadBasePath).resolve(fr.getFilePath()).resolve(fr.getRenameFilename());
            return p.toFile().exists() ? p.toString() : null;
        } catch (Exception e) {
            log.warn("[ContractImage] 서명 이미지 경로 조회 실패: {}", e.getMessage());
            return null;
        }
    }

    private boolean runPythonScript(String outputPath, String dataFilePath, String signImgPath)
            throws IOException, InterruptedException {

        // ✅ --data 대신 --data_file 로 JSON 파일 경로 전달
        List<String> cmd = new ArrayList<>(List.of(
                pythonPath, scriptPath,
                "--template", templatePath,
                "--output",   outputPath,
                "--data_file", dataFilePath
        ));
        if (signImgPath != null) { cmd.add("--sign_img"); cmd.add(signImgPath); }

        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.environment().put("PYTHONIOENCODING", "utf-8");  // ✅ 한글 인코딩
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