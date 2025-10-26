#!/usr/bin/env python3
"""
Security Scanner für CI/CD Pipeline

Führt Secret-Scanning und SBOM-Generierung durch.
Verwendet Trufflehog/Gitleaks für Secret-Scanning und pip-audit/npm audit für CVE-Scan.

Usage:
    python scripts/ci/security_scan.py
    python scripts/ci/security_scan.py --secrets-only
    python scripts/ci/security_scan.py --sbom-only
"""

import sys
import subprocess
import json
import pathlib
import argparse
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class SecurityIssue:
    """Security issue"""
    type: str  # 'secret', 'cve', 'dependency'
    severity: str  # 'critical', 'high', 'medium', 'low'
    file: str
    line: Optional[int]
    description: str
    tool: str


class SecurityScanner:
    """Security Scanner für Secrets und CVEs"""
    
    def __init__(self, root_path: pathlib.Path):
        self.root_path = root_path
        self.issues: List[SecurityIssue] = []
    
    def run_trufflehog(self) -> List[SecurityIssue]:
        """Führe Trufflehog Secret-Scanning durch"""
        issues = []
        
        try:
            # Prüfe ob Trufflehog installiert ist
            result = subprocess.run(['trufflehog', '--version'], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print("Warning: Trufflehog not found, skipping secret scan", file=sys.stderr)
                return issues
        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("Warning: Trufflehog not found, skipping secret scan", file=sys.stderr)
            return issues
        
        try:
            # Führe Trufflehog Scan durch
            cmd = [
                'trufflehog',
                'filesystem',
                str(self.root_path),
                '--json',
                '--no-verification'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                # Keine Secrets gefunden
                return issues
            
            # Parse JSON Output
            for line in result.stdout.split('\n'):
                if line.strip():
                    try:
                        data = json.loads(line)
                        issue = SecurityIssue(
                            type='secret',
                            severity='critical',  # Secrets sind immer kritisch
                            file=data.get('SourceMetadata', {}).get('Data', {}).get('Filesystem', {}).get('file', ''),
                            line=data.get('SourceMetadata', {}).get('Data', {}).get('Filesystem', {}).get('line'),
                            description=f"Secret detected: {data.get('DetectorName', 'Unknown')}",
                            tool='trufflehog'
                        )
                        issues.append(issue)
                    except json.JSONDecodeError:
                        continue
            
        except subprocess.TimeoutExpired:
            print("Warning: Trufflehog scan timed out", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Trufflehog scan failed: {e}", file=sys.stderr)
        
        return issues
    
    def run_gitleaks(self) -> List[SecurityIssue]:
        """Führe Gitleaks Secret-Scanning durch"""
        issues = []
        
        try:
            # Prüfe ob Gitleaks installiert ist
            result = subprocess.run(['gitleaks', 'version'], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print("Warning: Gitleaks not found, skipping secret scan", file=sys.stderr)
                return issues
        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("Warning: Gitleaks not found, skipping secret scan", file=sys.stderr)
            return issues
        
        try:
            # Führe Gitleaks Scan durch
            cmd = [
                'gitleaks',
                'detect',
                '--source', str(self.root_path),
                '--format', 'json',
                '--no-git'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                # Keine Secrets gefunden
                return issues
            
            # Parse JSON Output
            try:
                data = json.loads(result.stdout)
                for finding in data:
                    issue = SecurityIssue(
                        type='secret',
                        severity='critical',
                        file=finding.get('File', ''),
                        line=finding.get('StartLine', 0),
                        description=f"Secret detected: {finding.get('RuleID', 'Unknown')}",
                        tool='gitleaks'
                    )
                    issues.append(issue)
            except json.JSONDecodeError:
                pass
            
        except subprocess.TimeoutExpired:
            print("Warning: Gitleaks scan timed out", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Gitleaks scan failed: {e}", file=sys.stderr)
        
        return issues
    
    def run_pip_audit(self) -> List[SecurityIssue]:
        """Führe pip-audit für Python Dependencies durch"""
        issues = []
        
        requirements_file = self.root_path / 'backend' / 'requirements.txt'
        if not requirements_file.exists():
            return issues
        
        try:
            # Prüfe ob pip-audit installiert ist
            result = subprocess.run(['pip-audit', '--version'], 
                                  capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                print("Warning: pip-audit not found, skipping Python CVE scan", file=sys.stderr)
                return issues
        except (subprocess.TimeoutExpired, FileNotFoundError):
            print("Warning: pip-audit not found, skipping Python CVE scan", file=sys.stderr)
            return issues
        
        try:
            # Führe pip-audit durch
            cmd = [
                'pip-audit',
                '--requirement', str(requirements_file),
                '--format', 'json'
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                # Keine CVEs gefunden
                return issues
            
            # Parse JSON Output
            try:
                data = json.loads(result.stdout)
                for vuln in data.get('vulnerabilities', []):
                    severity = self._map_severity(vuln.get('severity', 'unknown'))
                    issue = SecurityIssue(
                        type='cve',
                        severity=severity,
                        file='backend/requirements.txt',
                        line=None,
                        description=f"CVE {vuln.get('id', 'Unknown')}: {vuln.get('description', 'No description')}",
                        tool='pip-audit'
                    )
                    issues.append(issue)
            except json.JSONDecodeError:
                pass
            
        except subprocess.TimeoutExpired:
            print("Warning: pip-audit scan timed out", file=sys.stderr)
        except Exception as e:
            print(f"Warning: pip-audit scan failed: {e}", file=sys.stderr)
        
        return issues
    
    def run_npm_audit(self) -> List[SecurityIssue]:
        """Führe npm audit für Node.js Dependencies durch"""
        issues = []
        
        package_json = self.root_path / 'real-estate-dashboard' / 'package.json'
        if not package_json.exists():
            return issues
        
        try:
            # Führe npm audit durch
            cmd = [
                'npm', 'audit',
                '--json',
                '--audit-level', 'moderate'
            ]
            
            # Wechsle ins Frontend-Verzeichnis
            cwd = package_json.parent
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300, cwd=cwd)
            
            if result.returncode == 0:
                # Keine CVEs gefunden
                return issues
            
            # Parse JSON Output
            try:
                data = json.loads(result.stdout)
                vulnerabilities = data.get('vulnerabilities', {})
                
                for vuln_name, vuln_data in vulnerabilities.items():
                    severity = self._map_severity(vuln_data.get('severity', 'unknown'))
                    issue = SecurityIssue(
                        type='cve',
                        severity=severity,
                        file='real-estate-dashboard/package.json',
                        line=None,
                        description=f"CVE in {vuln_name}: {vuln_data.get('description', 'No description')}",
                        tool='npm-audit'
                    )
                    issues.append(issue)
            except json.JSONDecodeError:
                pass
            
        except subprocess.TimeoutExpired:
            print("Warning: npm audit scan timed out", file=sys.stderr)
        except Exception as e:
            print(f"Warning: npm audit scan failed: {e}", file=sys.stderr)
        
        return issues
    
    def _map_severity(self, severity: str) -> str:
        """Mappe Severity-Level"""
        severity_map = {
            'critical': 'critical',
            'high': 'high',
            'moderate': 'medium',
            'medium': 'medium',
            'low': 'low',
            'info': 'low'
        }
        return severity_map.get(severity.lower(), 'medium')
    
    def generate_sbom(self) -> Dict:
        """Generiere Software Bill of Materials (SBOM)"""
        sbom = {
            'bomFormat': 'CycloneDX',
            'specVersion': '1.4',
            'version': 1,
            'metadata': {
                'timestamp': None,  # Wird zur Laufzeit gesetzt
                'tools': [
                    {'vendor': 'ImmoNow', 'name': 'Security Scanner', 'version': '1.0.0'}
                ]
            },
            'components': []
        }
        
        # Python Dependencies
        requirements_file = self.root_path / 'backend' / 'requirements.txt'
        if requirements_file.exists():
            try:
                with open(requirements_file, 'r') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            # Parse package name and version
                            if '==' in line:
                                name, version = line.split('==', 1)
                            elif '>=' in line:
                                name, version = line.split('>=', 1)
                            else:
                                name = line
                                version = 'unknown'
                            
                            component = {
                                'type': 'library',
                                'name': name.strip(),
                                'version': version.strip(),
                                'purl': f'pkg:pypi/{name.strip()}@{version.strip()}',
                                'scope': 'required'
                            }
                            sbom['components'].append(component)
            except Exception as e:
                print(f"Warning: Could not parse requirements.txt: {e}", file=sys.stderr)
        
        # Node.js Dependencies
        package_json = self.root_path / 'real-estate-dashboard' / 'package.json'
        if package_json.exists():
            try:
                with open(package_json, 'r') as f:
                    data = json.load(f)
                    dependencies = data.get('dependencies', {})
                    
                    for name, version in dependencies.items():
                        # Entferne ^ und ~ Präfixe
                        clean_version = version.replace('^', '').replace('~', '')
                        
                        component = {
                            'type': 'library',
                            'name': name,
                            'version': clean_version,
                            'purl': f'pkg:npm/{name}@{clean_version}',
                            'scope': 'required'
                        }
                        sbom['components'].append(component)
            except Exception as e:
                print(f"Warning: Could not parse package.json: {e}", file=sys.stderr)
        
        return sbom
    
    def save_sbom(self, sbom: Dict, output_file: pathlib.Path):
        """Speichere SBOM in Datei"""
        from datetime import datetime
        sbom['metadata']['timestamp'] = datetime.now().isoformat()
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(sbom, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error: Could not save SBOM: {e}", file=sys.stderr)
    
    def generate_report(self) -> str:
        """Generiere Security Report"""
        if not self.issues:
            return "✅ No security issues found!"
        
        # Gruppiere nach Severity
        critical = [i for i in self.issues if i.severity == 'critical']
        high = [i for i in self.issues if i.severity == 'high']
        medium = [i for i in self.issues if i.severity == 'medium']
        low = [i for i in self.issues if i.severity == 'low']
        
        report = []
        report.append("🔒 Security Scan Results")
        report.append("=" * 30)
        
        if critical:
            report.append(f"\n🚨 CRITICAL ({len(critical)}):")
            for issue in critical:
                report.append(f"  {issue.file}:{issue.line or 'N/A'} - {issue.description}")
        
        if high:
            report.append(f"\n⚠️  HIGH ({len(high)}):")
            for issue in high:
                report.append(f"  {issue.file}:{issue.line or 'N/A'} - {issue.description}")
        
        if medium:
            report.append(f"\n📋 MEDIUM ({len(medium)}):")
            for issue in medium:
                report.append(f"  {issue.file}:{issue.line or 'N/A'} - {issue.description}")
        
        if low:
            report.append(f"\nℹ️  LOW ({len(low)}):")
            for issue in low:
                report.append(f"  {issue.file}:{issue.line or 'N/A'} - {issue.description}")
        
        return "\n".join(report)


def main():
    parser = argparse.ArgumentParser(description='Security scanner for secrets and CVEs')
    parser.add_argument('--path', type=str, help='Path to scan (default: project root)')
    parser.add_argument('--secrets-only', action='store_true', help='Only scan for secrets')
    parser.add_argument('--sbom-only', action='store_true', help='Only generate SBOM')
    parser.add_argument('--output-sbom', type=str, default='sbom.json', help='SBOM output file')
    parser.add_argument('--exit-on-critical', action='store_true', help='Exit with error code on critical issues')
    
    args = parser.parse_args()
    
    # Bestimme Root-Pfad
    if args.path:
        root_path = pathlib.Path(args.path)
    else:
        # Finde Projekt-Root
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
    
    scanner = SecurityScanner(root_path)
    
    # Secret Scanning
    if not args.sbom_only:
        print("Scanning for secrets...")
        scanner.issues.extend(scanner.run_trufflehog())
        scanner.issues.extend(scanner.run_gitleaks())
    
    # CVE Scanning
    if not args.secrets_only and not args.sbom_only:
        print("Scanning for CVEs...")
        scanner.issues.extend(scanner.run_pip_audit())
        scanner.issues.extend(scanner.run_npm_audit())
    
    # SBOM Generation
    if not args.secrets_only:
        print("Generating SBOM...")
        sbom = scanner.generate_sbom()
        sbom_file = pathlib.Path(args.output_sbom)
        scanner.save_sbom(sbom, sbom_file)
        print(f"SBOM saved to {sbom_file}")
    
    # Generiere Report
    report = scanner.generate_report()
    print(report)
    
    # Exit-Code basierend auf kritischen Issues
    if args.exit_on_critical:
        critical_count = len([i for i in scanner.issues if i.severity == 'critical'])
        if critical_count > 0:
            sys.exit(1)
    
    sys.exit(0)


if __name__ == '__main__':
    main()
