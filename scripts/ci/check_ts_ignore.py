#!/usr/bin/env python3
"""
TypeScript @ts-ignore Counter für CI/CD Pipeline

Zählt @ts-ignore Kommentare außerhalb erlaubter Verzeichnisse.
Failt wenn neue @ts-ignore hinzugefügt werden.

Usage:
    python scripts/ci/check_ts_ignore.py
    python scripts/ci/check_ts_ignore.py --baseline-file scripts/ci/ts_ignore.baseline
    python scripts/ci/check_ts_ignore.py --update-baseline
"""

import sys
import re
import pathlib
import argparse
import json
from typing import List, Dict, Set
from dataclasses import dataclass


@dataclass
class TsIgnoreEntry:
    """@ts-ignore entry"""
    file: str
    line: int
    content: str
    reason: str = ""


class TsIgnoreCounter:
    """Counter für @ts-ignore Kommentare"""
    
    def __init__(self, root_path: pathlib.Path):
        self.root_path = root_path
        self.allowed_dirs = {
            'compat',  # Erlaubte Verzeichnisse für @ts-ignore
            'legacy',
            'vendor',
            'third-party'
        }
        self.allowed_files = {
            'compat_', '_compat.',
            'legacy_', '_legacy.',
            'vendor_', '_vendor.'
        }
        self.entries: List[TsIgnoreEntry] = []
    
    def is_allowed_path(self, file_path: pathlib.Path) -> bool:
        """Prüfe ob Pfad erlaubt ist für @ts-ignore"""
        relative_path = file_path.relative_to(self.root_path)
        
        # Prüfe Verzeichnisnamen
        for part in relative_path.parts:
            if part in self.allowed_dirs:
                return True
        
        # Prüfe Dateinamen
        filename = file_path.name
        for allowed_prefix in self.allowed_files:
            if filename.startswith(allowed_prefix) or allowed_prefix in filename:
                return True
        
        return False
    
    def should_scan_file(self, file_path: pathlib.Path) -> bool:
        """Prüfe ob Datei gescannt werden soll"""
        # Nur TypeScript/JavaScript Dateien
        if file_path.suffix not in {'.ts', '.tsx', '.js', '.jsx'}:
            return False
        
        # Ignoriere node_modules, .git, etc.
        if any(part in {'.git', 'node_modules', '.next', 'dist', 'build', '__pycache__'} 
               for part in file_path.parts):
            return False
        
        return True
    
    def scan_file(self, file_path: pathlib.Path) -> List[TsIgnoreEntry]:
        """Scanne einzelne Datei nach @ts-ignore"""
        entries = []
        
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        except Exception as e:
            print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
            return entries
        
        lines = content.split('\n')
        
        for line_num, line in enumerate(lines, 1):
            # Suche nach @ts-ignore Kommentaren
            ts_ignore_match = re.search(r'@ts-ignore(?:\s+(.*))?', line)
            if ts_ignore_match:
                reason = ts_ignore_match.group(1) or ""
                
                entry = TsIgnoreEntry(
                    file=str(file_path.relative_to(self.root_path)),
                    line=line_num,
                    content=line.strip(),
                    reason=reason.strip()
                )
                entries.append(entry)
        
        return entries
    
    def scan_directory(self, path: pathlib.Path = None) -> List[TsIgnoreEntry]:
        """Scanne Verzeichnis rekursiv"""
        if path is None:
            path = self.root_path
        
        all_entries = []
        
        for file_path in path.rglob('*'):
            if file_path.is_file() and self.should_scan_file(file_path):
                entries = self.scan_file(file_path)
                all_entries.extend(entries)
        
        return all_entries
    
    def filter_allowed_entries(self, entries: List[TsIgnoreEntry]) -> List[TsIgnoreEntry]:
        """Filtere erlaubte @ts-ignore Einträge"""
        filtered = []
        
        for entry in entries:
            file_path = pathlib.Path(entry.file)
            
            # Prüfe ob Pfad erlaubt ist
            if not self.is_allowed_path(file_path):
                filtered.append(entry)
        
        return filtered
    
    def load_baseline(self, baseline_file: pathlib.Path) -> Dict[str, int]:
        """Lade Baseline aus Datei"""
        if not baseline_file.exists():
            return {}
        
        try:
            with open(baseline_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not read baseline {baseline_file}: {e}", file=sys.stderr)
            return {}
    
    def save_baseline(self, baseline_file: pathlib.Path, counts: Dict[str, int]):
        """Speichere Baseline in Datei"""
        try:
            with open(baseline_file, 'w', encoding='utf-8') as f:
                json.dump(counts, f, indent=2, sort_keys=True)
        except Exception as e:
            print(f"Error: Could not save baseline {baseline_file}: {e}", file=sys.stderr)
    
    def count_by_file(self, entries: List[TsIgnoreEntry]) -> Dict[str, int]:
        """Zähle @ts-ignore pro Datei"""
        counts = {}
        
        for entry in entries:
            if entry.file not in counts:
                counts[entry.file] = 0
            counts[entry.file] += 1
        
        return counts
    
    def generate_report(self, current_counts: Dict[str, int], baseline_counts: Dict[str, int]) -> str:
        """Generiere Report"""
        report = []
        report.append("TypeScript @ts-ignore Analysis")
        report.append("=" * 40)
        
        # Gesamt-Zählung
        current_total = sum(current_counts.values())
        baseline_total = sum(baseline_counts.values())
        
        report.append(f"\nTotal @ts-ignore (excluding allowed directories):")
        report.append(f"  Current: {current_total}")
        report.append(f"  Baseline: {baseline_total}")
        
        if current_total > baseline_total:
            report.append(f"  ⚠️  Increase: +{current_total - baseline_total}")
        elif current_total < baseline_total:
            report.append(f"  ✅ Decrease: {current_total - baseline_total}")
        else:
            report.append(f"  ✅ No change")
        
        # Neue Dateien mit @ts-ignore
        new_files = set(current_counts.keys()) - set(baseline_counts.keys())
        if new_files:
            report.append(f"\n🆕 New files with @ts-ignore:")
            for file in sorted(new_files):
                report.append(f"  {file}: {current_counts[file]}")
        
        # Erhöhte Zählungen
        increased_files = []
        for file in current_counts:
            if file in baseline_counts:
                diff = current_counts[file] - baseline_counts[file]
                if diff > 0:
                    increased_files.append((file, diff))
        
        if increased_files:
            report.append(f"\n📈 Files with increased @ts-ignore count:")
            for file, diff in sorted(increased_files):
                report.append(f"  {file}: +{diff} (was {baseline_counts[file]}, now {current_counts[file]})")
        
        # Top-Dateien mit @ts-ignore
        if current_counts:
            report.append(f"\n📊 Top files with @ts-ignore:")
            sorted_files = sorted(current_counts.items(), key=lambda x: x[1], reverse=True)
            for file, count in sorted_files[:10]:  # Top 10
                report.append(f"  {file}: {count}")
        
        return "\n".join(report)
    
    def check_violations(self, current_counts: Dict[str, int], baseline_counts: Dict[str, int]) -> List[str]:
        """Prüfe auf Verletzungen"""
        violations = []
        
        # Neue Dateien mit @ts-ignore
        new_files = set(current_counts.keys()) - set(baseline_counts.keys())
        for file in new_files:
            violations.append(f"New file with @ts-ignore: {file} ({current_counts[file]} occurrences)")
        
        # Erhöhte Zählungen
        for file in current_counts:
            if file in baseline_counts:
                diff = current_counts[file] - baseline_counts[file]
                if diff > 0:
                    violations.append(f"Increased @ts-ignore in {file}: +{diff}")
        
        return violations


def main():
    parser = argparse.ArgumentParser(description='Count @ts-ignore comments')
    parser.add_argument('--path', type=str, help='Path to scan (default: project root)')
    parser.add_argument('--baseline-file', type=str, default='scripts/ci/ts_ignore.baseline', help='Baseline file path')
    parser.add_argument('--update-baseline', action='store_true', help='Update baseline with current counts')
    parser.add_argument('--output', type=str, choices=['text', 'json'], default='text', help='Output format')
    parser.add_argument('--exit-on-increase', action='store_true', help='Exit with error code if @ts-ignore count increased')
    
    args = parser.parse_args()
    
    # Bestimme Root-Pfad
    if args.path:
        root_path = pathlib.Path(args.path)
    else:
        # Finde Projekt-Root (suche nach package.json)
        current = pathlib.Path(__file__).parent
        while current != current.parent:
            if (current / 'package.json').exists():
                root_path = current
                break
            current = current.parent
        else:
            root_path = pathlib.Path.cwd()
    
    if not root_path.exists():
        print(f"Error: Path {root_path} does not exist", file=sys.stderr)
        sys.exit(1)
    
    # Scanne Codebase
    counter = TsIgnoreCounter(root_path)
    all_entries = counter.scan_directory()
    filtered_entries = counter.filter_allowed_entries(all_entries)
    current_counts = counter.count_by_file(filtered_entries)
    
    # Lade Baseline
    baseline_file = pathlib.Path(args.baseline_file)
    baseline_counts = counter.load_baseline(baseline_file)
    
    # Update Baseline falls gewünscht
    if args.update_baseline:
        counter.save_baseline(baseline_file, current_counts)
        print("✅ Baseline updated successfully")
        sys.exit(0)
    
    # Generiere Report
    if args.output == 'json':
        report = json.dumps({
            'current_counts': current_counts,
            'baseline_counts': baseline_counts,
            'total_current': sum(current_counts.values()),
            'total_baseline': sum(baseline_counts.values())
        }, indent=2)
    else:
        report = counter.generate_report(current_counts, baseline_counts)
    
    print(report)
    
    # Prüfe auf Verletzungen
    violations = counter.check_violations(current_counts, baseline_counts)
    if violations and args.exit_on_increase:
        print("\n❌ Violations found:")
        for violation in violations:
            print(f"  - {violation}")
        sys.exit(1)
    
    sys.exit(0)


if __name__ == '__main__':
    main()
