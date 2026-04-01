<?php

echo "=== School Year Calculation Test ===\n\n";

$now = new DateTime();
$currentYear = (int)$now->format('Y');
$currentMonth = (int)$now->format('m');

echo "Current Date: " . $now->format('Y-m-d') . "\n";
echo "Current Month: $currentMonth\n";
echo "Current Year: $currentYear\n\n";

$schoolYear = $currentMonth >= 9
    ? "{$currentYear}-" . ($currentYear + 1)
    : ($currentYear - 1) . "-{$currentYear}";

$nextSchoolYear = $currentMonth >= 9
    ? ($currentYear + 1) . "-" . ($currentYear + 2)
    : "{$currentYear}-" . ($currentYear + 1);

echo "School Year: $schoolYear\n";
echo "Next School Year: $nextSchoolYear\n\n";

echo "The dashboard should show events for:\n";
echo "- $schoolYear\n";
echo "- $nextSchoolYear\n";
