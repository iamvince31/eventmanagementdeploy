<?php

namespace App\Services;

class ValidationResult
{
    public bool $requiresApproval;
    public array $violations;
    public array $approversNeeded;
    
    public function __construct(bool $requiresApproval, array $violations = [], array $approversNeeded = [])
    {
        $this->requiresApproval = $requiresApproval;
        $this->violations = $violations;
        $this->approversNeeded = $approversNeeded;
    }
}