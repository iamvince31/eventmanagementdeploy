<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SystemSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            'departments' => [
                'Department of Information Technology',
                'Department of Industrial Engineering and Technology',
                'Department of Computer, Electronics, and Electrical Engineering',
                'Department of Civil Engineering and Architecture',
                'Department of Agriculture and Food Engineering',
            ],
            'designations' => ['Dean', 'CEIT Official', 'Faculty Member', 'Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator'],
            'ceit_officer_types' => [
                'College Secretary',
                'College Inspector',
                'College Budget Officer',
                'College Registrar',
                'Assistant College Registrar',
                'Records Custodian',
                'College MIS',
                'ILCLO',
                'Coordinator, Research Services',
                'Coordinator, Graduate Programs',
                'Coordinator, Research Monitoring and Evaluation Unit',
                'Coordinator, Extension Services',
                'Coordinator, Extension Monitoring and Evaluation Unit',
                'College OJT Coordinator',
                'Coordinator, College Quality Assurance and Accreditation',
                'Asst. Coordinator, College Quality Assurance and Accreditation',
                'Coordinator, Knowledge Management Unit',
                'Coordinator, Gender and Development Program',
                'Coordinator, Gender and Development Program (alternate)',
                'Coordinator, Sports Development',
                'Coordinator, Socio-cultural Development',
                'Coordinator, Continuous Quality Improvement (CQI)',
                'College Public Information Officer',
                'Coordinator, Pollution Control',
                'College Review Coordinator for BSABE and BSCE',
                'College Review Coordinator for BSECE and BSEE',
                'College Guidance Facilitator for BSABE, BSIT, BSCS, and Architecture Programs',
                'College Guidance Facilitator for BSCE, BSECE, BSEE, BSCpE, BSIE and BIT programs',
                'College Job Placement Officer',
                'College Property Custodian',
                'College Canvasser',
                'In-charge, College Reading Room',
                'In-charge, Material Testing Laboratory',
                'College Civil Security Officer',
                'College Safety Officer',
                'In-charge, Simulation and Math Laboratory',
                'Head, CCL and Technical Support Services Unit',
                'University Web Master',
                'In-charge, e-Learning Team',
            ]
        ];

        foreach ($settings as $key => $value) {
            \App\Models\SystemSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
