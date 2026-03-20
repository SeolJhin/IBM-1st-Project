#!/usr/bin/env python3
"""
Audit legacy rows in files table from a CSV export and generate SQL patches.

Expected CSV columns:
  file_id,file_path,origin_filename,rename_filename,delete_yn

Usage example:
  python scripts/audit_legacy_file_keys.py ^
    --input-csv .tmp/files_active.csv ^
    --bucket uniplace-files-194722402714-ap-northeast-2-an ^
    --region ap-northeast-2 ^
    --output-dir .tmp/file-audit
"""

from __future__ import annotations

import argparse
import csv
import pathlib
import subprocess
from dataclasses import dataclass


def normalize_path(value: str) -> str:
    text = (value or "").strip().replace("\\", "/")
    while text.startswith("/"):
        text = text[1:]
    while "//" in text:
        text = text.replace("//", "/")
    return text


def looks_like_file_path(path_value: str) -> bool:
    value = normalize_path(path_value)
    if not value or value.endswith("/"):
        return False
    last = value.rsplit("/", 1)[-1]
    if "." not in last:
        return False
    name, ext = last.rsplit(".", 1)
    return bool(name and ext)


def parent_dir(path_value: str) -> str:
    value = normalize_path(path_value)
    if "/" not in value:
        return ""
    return value.rsplit("/", 1)[0]


def to_key(dir_value: str, file_name: str) -> str:
    d = normalize_path(dir_value)
    f = normalize_path(file_name)
    if not d:
        return f
    if not f:
        return d
    return f"{d}/{f}"


def sql_escape(value: str) -> str:
    return value.replace("'", "''")


def head_object(bucket: str, key: str, region: str, profile: str | None) -> str:
    cmd = ["aws"]
    if profile:
        cmd.extend(["--profile", profile])
    cmd.extend(
        [
            "--region",
            region,
            "s3api",
            "head-object",
            "--bucket",
            bucket,
            "--key",
            key,
        ]
    )

    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode == 0:
        return "found"

    err = (proc.stderr or "").lower()
    if "not found" in err or "404" in err or "nosuchkey" in err:
        return "missing"
    if "accessdenied" in err or "403" in err:
        return "denied"
    return f"error:{(proc.stderr or '').strip()[:160]}"


@dataclass
class RowResult:
    file_id: int
    file_path: str
    rename_filename: str
    origin_filename: str
    decision: str
    selected_key: str
    notes: str


def decide_row(row: dict[str, str], bucket: str, region: str, profile: str | None) -> RowResult:
    file_id = int(row["file_id"])
    file_path = row.get("file_path", "")
    rename = row.get("rename_filename", "")
    origin = row.get("origin_filename", "")

    normalized = normalize_path(file_path)
    legacy_mode = looks_like_file_path(normalized)

    candidates: list[tuple[str, str]] = []
    if legacy_mode:
        candidates.append(("legacy_path", normalized))
        pdir = parent_dir(normalized)
        if rename:
            candidates.append(("dir_rename", to_key(pdir, rename)))
        if origin and origin != rename:
            candidates.append(("dir_origin", to_key(pdir, origin)))
    else:
        if rename:
            candidates.append(("dir_rename", to_key(normalized, rename)))
        if origin and origin != rename:
            candidates.append(("dir_origin", to_key(normalized, origin)))

    found_label = ""
    found_key = ""
    denied = False
    errors: list[str] = []
    for label, key in candidates:
        status = head_object(bucket, key, region, profile)
        if status == "found":
            found_label, found_key = label, key
            break
        if status == "denied":
            denied = True
        elif status.startswith("error:"):
            errors.append(status)

    if found_label == "dir_rename" and legacy_mode:
        return RowResult(
            file_id=file_id,
            file_path=normalized,
            rename_filename=rename,
            origin_filename=origin,
            decision="normalize_to_directory",
            selected_key=found_key,
            notes="directory + rename exists",
        )

    if found_label in {"legacy_path", "dir_rename", "dir_origin"}:
        return RowResult(
            file_id=file_id,
            file_path=normalized,
            rename_filename=rename,
            origin_filename=origin,
            decision="keep_active",
            selected_key=found_key,
            notes=f"{found_label} exists",
        )

    if denied:
        return RowResult(
            file_id=file_id,
            file_path=normalized,
            rename_filename=rename,
            origin_filename=origin,
            decision="manual_check",
            selected_key="",
            notes="access denied while probing S3 key",
        )

    note = "; ".join(errors) if errors else "no candidate key found"
    return RowResult(
        file_id=file_id,
        file_path=normalized,
        rename_filename=rename,
        origin_filename=origin,
        decision="soft_delete_candidate",
        selected_key="",
        notes=note,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-csv", required=True)
    parser.add_argument("--bucket", required=True)
    parser.add_argument("--region", default="ap-northeast-2")
    parser.add_argument("--profile")
    parser.add_argument("--output-dir", required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    input_csv = pathlib.Path(args.input_csv)
    output_dir = pathlib.Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    rows: list[dict[str, str]] = []
    with input_csv.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if (row.get("delete_yn") or "").upper() == "Y":
                continue
            if not (row.get("file_id") and row.get("file_path")):
                continue
            rows.append(row)

    results: list[RowResult] = []
    for row in rows:
        results.append(decide_row(row, args.bucket, args.region, args.profile))

    update_sql_path = output_dir / "fix_updates.sql"
    delete_sql_path = output_dir / "soft_delete_candidates.sql"
    report_csv_path = output_dir / "audit_report.csv"

    with update_sql_path.open("w", encoding="utf-8", newline="") as f:
        f.write("-- generated by audit_legacy_file_keys.py\n")
        f.write("START TRANSACTION;\n")
        for r in results:
            if r.decision != "normalize_to_directory":
                continue
            pdir = parent_dir(r.file_path)
            target = f"{pdir}/" if pdir else ""
            f.write(
                "UPDATE files SET file_path='{}' WHERE file_id={} AND delete_yn='N';\n".format(
                    sql_escape(target), r.file_id
                )
            )
        f.write("COMMIT;\n")

    with delete_sql_path.open("w", encoding="utf-8", newline="") as f:
        f.write("-- generated by audit_legacy_file_keys.py\n")
        f.write("START TRANSACTION;\n")
        for r in results:
            if r.decision != "soft_delete_candidate":
                continue
            f.write(
                "UPDATE files SET delete_yn='Y' WHERE file_id={} AND delete_yn='N';\n".format(
                    r.file_id
                )
            )
        f.write("COMMIT;\n")

    with report_csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(
            [
                "file_id",
                "file_path",
                "rename_filename",
                "origin_filename",
                "decision",
                "selected_key",
                "notes",
            ]
        )
        for r in results:
            writer.writerow(
                [
                    r.file_id,
                    r.file_path,
                    r.rename_filename,
                    r.origin_filename,
                    r.decision,
                    r.selected_key,
                    r.notes,
                ]
            )

    summary = {
        "normalize_to_directory": 0,
        "keep_active": 0,
        "manual_check": 0,
        "soft_delete_candidate": 0,
    }
    for r in results:
        summary[r.decision] = summary.get(r.decision, 0) + 1

    print("Audit done")
    for key in sorted(summary.keys()):
        print(f"  {key}: {summary[key]}")
    print(f"  report: {report_csv_path}")
    print(f"  updates: {update_sql_path}")
    print(f"  soft-delete: {delete_sql_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
