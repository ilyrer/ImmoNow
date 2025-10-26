#!/usr/bin/env python3
"""
Mock Pattern Scanner für CI/CD Pipeline

Prüft auf Mock-Daten und Leak-Patterns in Production-Code.
Sollte in GitHub Actions als PR-Checker laufen.

Usage:
    python scripts/ci/check_mocks.py
    python scripts/ci/check_mocks.py --path backend/app/api/v1/
    python scripts/ci/check_mocks.py --allow-file scripts/ci/check_mocks.allow
"""

import sys
import re
import pathlib
import argparse
import json
from typing import List, Set, Dict, Tuple
from dataclasses import dataclass


@dataclass
class MockPattern:
    """Mock pattern definition"""
    pattern: str
    description: str
    severity: str  # 'error', 'warning', 'info'
    category: str  # 'mock', 'hardcoded', 'test_data', 'placeholder'


class MockScanner:
    """Scanner für Mock-Patterns und Datenlecks"""
    
    def __init__(self, root_path: pathlib.Path):
        self.root_path = root_path
        self.patterns = self._load_patterns()
        self.allowed_dirs = {
            'tests', 'test', '__tests__', '__test__',
            'stories', 'storybook', '__stories__',
            '__mocks__', 'mocks', 'mock',
            'fixtures', 'fixture',
            'docs', 'documentation',
            'examples', 'example',
            'demos', 'demo',
            'playground', 'sandbox'
        }
        self.allowed_files = {
            'test_', 'spec_', '_test.', '_spec.',
            'mock_', '_mock.', 'fixture_', '_fixture.',
            'story_', '_story.', 'example_', '_example.'
        }
        self.violations: List[Dict] = []
    
    def _load_patterns(self) -> List[MockPattern]:
        """Lade Mock-Patterns"""
        return [
            # Mock-Daten Patterns
            MockPattern(
                pattern=r"Math\.random\(",
                description="Math.random() usage - should use real data",
                severity="error",
                category="mock"
            ),
            MockPattern(
                pattern=r"\bmock(Data|s)?\b",
                description="Mock data references",
                severity="error",
                category="mock"
            ),
            MockPattern(
                pattern=r"__mocks__",
                description="Mock directory reference",
                severity="warning",
                category="mock"
            ),
            MockPattern(
                pattern=r"\bfaker\b",
                description="Faker library usage",
                severity="error",
                category="mock"
            ),
            MockPattern(
                pattern=r"\bjson-server\b",
                description="JSON Server usage",
                severity="error",
                category="mock"
            ),
            
            # Hardcoded Data Patterns
            MockPattern(
                pattern=r"\bsample_\w+",
                description="Sample data variables",
                severity="error",
                category="hardcoded"
            ),
            MockPattern(
                pattern=r"\bdummy\b",
                description="Dummy data references",
                severity="error",
                category="hardcoded"
            ),
            MockPattern(
                pattern=r"\bplayground\b",
                description="Playground references",
                severity="warning",
                category="hardcoded"
            ),
            MockPattern(
                pattern=r"\bsandbox\b",
                description="Sandbox references",
                severity="warning",
                category="hardcoded"
            ),
            
            # Test Data Patterns
            MockPattern(
                pattern=r"MockService",
                description="Mock service classes",
                severity="error",
                category="test_data"
            ),
            MockPattern(
                pattern=r"testData\s*=",
                description="Test data assignments",
                severity="error",
                category="test_data"
            ),
            MockPattern(
                pattern=r"mockResponse\s*=",
                description="Mock response assignments",
                severity="error",
                category="test_data"
            ),
            
            # Placeholder Patterns
            MockPattern(
                pattern=r"TODO.*mock",
                description="TODO comments about mocks",
                severity="info",
                category="placeholder"
            ),
            MockPattern(
                pattern=r"FIXME.*mock",
                description="FIXME comments about mocks",
                severity="info",
                category="placeholder"
            ),
            MockPattern(
                pattern=r"placeholder.*data",
                description="Placeholder data references",
                severity="warning",
                category="placeholder"
            ),
            
            # Hardcoded Arrays in Endpoints
            MockPattern(
                pattern=r"return\s*\[.*\{.*id.*:.*[\"'].*[\"'].*\}",
                description="Hardcoded return arrays in endpoints",
                severity="error",
                category="hardcoded"
            ),
            MockPattern(
                pattern=r"fallback.*=.*\[",
                description="Fallback arrays",
                severity="error",
                category="hardcoded"
            ),
        ]
    
    def is_allowed_path(self, file_path: pathlib.Path) -> bool:
        """Prüfe ob Pfad erlaubt ist"""
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
        # Nur bestimmte Dateitypen
        if file_path.suffix not in {'.ts', '.tsx', '.js', '.jsx', '.py', '.json', '.md'}:
            return False
        
        # Ignoriere node_modules, .git, etc.
        if any(part in {'.git', 'node_modules', '.next', 'dist', 'build', '__pycache__'} 
               for part in file_path.parts):
            return False
        
        # Prüfe ob Pfad erlaubt ist
        if self.is_allowed_path(file_path):
            return False
        
        return True
    
    def scan_file(self, file_path: pathlib.Path) -> List[Dict]:
        """Scanne einzelne Datei"""
        violations = []
        
        try:
            content = file_path.read_text(encoding='utf-8', errors='ignore')
        except Exception as e:
            print(f"Warning: Could not read {file_path}: {e}", file=sys.stderr)
            return violations
        
        for pattern_def in self.patterns:
            matches = re.finditer(pattern_def.pattern, content, re.IGNORECASE | re.MULTILINE)
            
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1
                line_content = content.split('\n')[line_num - 1].strip()
                
                violation = {
                    'file': str(file_path.relative_to(self.root_path)),
                    'line': line_num,
                    'pattern': pattern_def.pattern,
                    'description': pattern_def.description,
                    'severity': pattern_def.severity,
                    'category': pattern_def.category,
                    'match': match.group(),
                    'line_content': line_content
                }
                violations.append(violation)
        
        return violations
    
    def scan_directory(self, path: pathlib.Path = None) -> List[Dict]:
        """Scanne Verzeichnis rekursiv"""
        if path is None:
            path = self.root_path
        
        all_violations = []
        
        for file_path in path.rglob('*'):
            if file_path.is_file() and self.should_scan_file(file_path):
                violations = self.scan_file(file_path)
                all_violations.extend(violations)
        
        return all_violations
    
    def load_allowlist(self, allowlist_file: pathlib.Path) -> Set[str]:
        """Lade Allowlist aus Datei"""
        if not allowlist_file.exists():
            return set()
        
        try:
            with open(allowlist_file, 'r', encoding='utf-8') as f:
                return {line.strip() for line in f if line.strip() and not line.startswith('#')}
        except Exception as e:
            print(f"Warning: Could not read allowlist {allowlist_file}: {e}", file=sys.stderr)
            return set()
    
    def filter_violations(self, violations: List[Dict], allowlist: Set[str]) -> List[Dict]:
        """Filtere Violations basierend auf Allowlist"""
        filtered = []
        
        for violation in violations:
            # Erstelle Identifier für Violation
            identifier = f"{violation['file']}:{violation['line']}:{violation['pattern']}"
            
            if identifier not in allowlist:
                filtered.append(violation)
        
        return filtered
    
    def generate_report(self, violations: List[Dict]) -> str:
        """Generiere Report"""
        if not violations:
            return "✅ No mock patterns found!"
        
        # Gruppiere nach Severity
        errors = [v for v in violations if v['severity'] == 'error']
        warnings = [v for v in violations if v['severity'] == 'warning']
        infos = [v for v in violations if v['severity'] == 'info']
        
        report = []
        report.append("🚨 Mock Pattern Violations Found:")
        report.append("=" * 50)
        
        if errors:
            report.append(f"\n❌ ERRORS ({len(errors)}):")
            for violation in errors:
                report.append(f"  {violation['file']}:{violation['line']}")
                report.append(f"    Pattern: {violation['pattern']}")
                report.append(f"    Description: {violation['description']}")
                report.append(f"    Match: '{violation['match']}'")
                report.append(f"    Line: {violation['line_content']}")
                report.append("")
        
        if warnings:
            report.append(f"\n⚠️  WARNINGS ({len(warnings)}):")
            for violation in warnings:
                report.append(f"  {violation['file']}:{violation['line']} - {violation['description']}")
        
        if infos:
            report.append(f"\nℹ️  INFO ({len(infos)}):")
            for violation in infos:
                report.append(f"  {violation['file']}:{violation['line']} - {violation['description']}")
        
        return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description='Scan for mock patterns in codebase')
    parser.add_argument('--path', type=str, help='Path to scan (default: project root)')
    parser.add_argument('--allow-file', type=str, help='Allowlist file path')
    parser.add_argument('--output', type=str, choices=['text', 'json'], default='text', help='Output format')
    parser.add_argument('--exit-on-error', action='store_true', help='Exit with error code if violations found')
    
    args = parser.parse_args()
    
    # Bestimme Root-Pfad
    if args.path:
        root_path = pathlib.Path(args.path)
    else:
        # Finde Projekt-Root (suche nach package.json oder requirements.txt)
        current = pathlib.Path(__file__).parent
        while current != current.parent:
            if (current / 'package.json').exists() or (current / 'requirements.txt').exists():
                root_path = current
                break
            current = current.parent
        else:
            root_path = pathlib.Path.cwd()
    
    if not root_path.exists():
        print(f"Error: Path {root_path} does not exist", file=sys.stderr)
        sys.exit(1)
    
    # Lade Allowlist
    allowlist = set()
    if args.allow_file:
        allowlist_file = pathlib.Path(args.allow_file)
        allowlist = MockScanner(root_path).load_allowlist(allowlist_file)
    
    # Scanne Codebase
    scanner = MockScanner(root_path)
    violations = scanner.scan_directory()
    filtered_violations = scanner.filter_violations(violations, allowlist)
    
    # Generiere Report
    if args.output == 'json':
        report = json.dumps(filtered_violations, indent=2)
    else:
        report = scanner.generate_report(filtered_violations)
    
    print(report)
    
    # Exit-Code basierend auf Errors
    if args.exit_on_error:
        error_count = len([v for v in filtered_violations if v['severity'] == 'error'])
        if error_count > 0:
            sys.exit(1)
    
    sys.exit(0)


if __name__ == '__main__':
    main()
