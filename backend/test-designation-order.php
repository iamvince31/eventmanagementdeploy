<?php

// Test the designation ordering logic

// Simulate custom designations from database
$customDesignations = ['Dean', 'CEIT Official', 'Faculty Member', 'Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'test', 'GAD Coordinator'];

// Define the hierarchy order
$baseOrder = ['Chairperson', 'CEIT Official'];

// Add custom designations (excluding predefined ones) after CEIT Official
$predefinedDesignations = ['Dean', 'CEIT Official', 'Faculty Member', 'Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'Admin'];
$customOnly = array_diff($customDesignations, $predefinedDesignations);

// Build the complete order
$orderArray = array_merge(
    $baseOrder,
    ['Department Research Coordinator', 'Department Extension Coordinator'],
    $customOnly,
    ['Program Coordinator', 'Faculty Member']
);

echo "Custom designations from database:\n";
print_r($customDesignations);

echo "\nPredefined designations (excluded from custom):\n";
print_r($predefinedDesignations);

echo "\nCustom-only designations:\n";
print_r($customOnly);

echo "\nFinal order array:\n";
print_r($orderArray);

echo "\nFinal FIELD() clause:\n";
$orderString = implode("', '", array_map(function($item) {
    return addslashes($item);
}, $orderArray));
echo "FIELD(designation, '{$orderString}')\n";

echo "\n✅ Expected hierarchy:\n";
echo "1. Chairperson\n";
echo "2. CEIT Official\n";
echo "3. Department Research Coordinator\n";
echo "4. Department Extension Coordinator\n";
echo "5. test (custom)\n";
echo "6. GAD Coordinator (custom)\n";
echo "7. Program Coordinator\n";
echo "8. Faculty Member\n";
