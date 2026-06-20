$content = Get-Content app.js -Raw

$pattern = "(?s)const linkiAc = \(ae\) => \{.*?window\.open\(finalLink, '_blank'\);\s*return;\s*\};"
$replacement = @"
const linkiAc = (ae) => {
    if (isScrolling) return;
    ae.preventDefault();
    ae.stopPropagation();
    window.open(oyun.link, '_blank');
    return;
};
"@

$newContent = [regex]::Replace($content, $pattern, $replacement)

Set-Content -Path app.js -Value $newContent -Encoding UTF8
