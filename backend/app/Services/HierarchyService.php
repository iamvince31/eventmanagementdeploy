<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class HierarchyService
{
    /**
     * Role hierarchy levels (higher number = higher authority)
     */
    private const ROLE_HIERARCHY = [
        'Faculty Member' => 1,
        'Coordinator' => 2,
        'Chairperson' => 3,
        'Dean' => 4,
        'Admin' => 5,
    ];



    /**
     * Validate invitations based on hierarchy rules
     */
    public function validateInvitations(User $host, array $inviteeIds): ValidationResult
    {
        if (empty($inviteeIds)) {
            return new ValidationResult(false);
        }

        $invitees = User::whereIn('id', $inviteeIds)->get();
        $hostLevel = $this->getRoleLevel($host->role);
        $violations = [];
        $approversNeeded = [];

        foreach ($invitees as $invitee) {
            $inviteeLevel = $this->getRoleLevel($invitee->role);
            
            // Check if host is inviting someone of higher hierarchy
            if ($inviteeLevel > $hostLevel) {
                $violations[] = [
                    'invitee_id' => $invitee->id,
                    'invitee_name' => $invitee->name,
                    'invitee_role' => $invitee->role,
                    'host_role' => $host->role,
                ];
                
                // Add the higher-level invitee as required approver
                if (!in_array($invitee->id, $approversNeeded)) {
                    $approversNeeded[] = $invitee->id;
                }
            }
        }

        return new ValidationResult(
            !empty($violations),
            $violations,
            $approversNeeded
        );
    }
    /**
     * Check if approval is required for the given invitations
     */
    public function requiresApproval(User $host, array $inviteeIds): bool
    {
        return $this->validateInvitations($host, $inviteeIds)->requiresApproval;
    }

    /**
     * Get the list of approvers needed for the given invitations
     */
    public function getApproversNeeded(User $host, array $inviteeIds): array
    {
        return $this->validateInvitations($host, $inviteeIds)->approversNeeded;
    }

    /**
     * Get the role hierarchy as an array
     */
    public function getRoleHierarchy(): array
    {
        return self::ROLE_HIERARCHY;
    }

    /**
     * Get the hierarchy level for a given role
     */
    private function getRoleLevel(string $role): int
    {
        return self::ROLE_HIERARCHY[$role] ?? 0;
    }

    /**
     * Check if one role is higher than another in the hierarchy
     */
    public function isHigherRole(string $role1, string $role2): bool
    {
        return $this->getRoleLevel($role1) > $this->getRoleLevel($role2);
    }

    /**
     * Get all roles that are higher than the given role
     */
    public function getHigherRoles(string $role): array
    {
        $currentLevel = $this->getRoleLevel($role);
        return array_keys(array_filter(
            self::ROLE_HIERARCHY,
            fn($level) => $level > $currentLevel
        ));
    }

    /**
     * Get all roles that are lower than or equal to the given role
     */
    public function getLowerOrEqualRoles(string $role): array
    {
        $currentLevel = $this->getRoleLevel($role);
        return array_keys(array_filter(
            self::ROLE_HIERARCHY,
            fn($level) => $level <= $currentLevel
        ));
    }
}