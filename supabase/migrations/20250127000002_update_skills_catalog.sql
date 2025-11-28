-- Update Skills Catalog with Interpreter-Specific Skills
-- Migration: 20250127000002_update_skills_catalog

-- Delete generic skills from initial seed
DELETE FROM skills WHERE category IN ('Soft Skills', 'Cognitive', 'Management', 'Technical', 'Analytical');

-- Insert interpreter-specific skills

-- Linguistic Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Simultaneous Interpreting', 'linguistic', 'Real-time interpretation between languages while speaker continues',
 '{"1": "Can handle basic greetings and simple exchanges", "2": "Can manage routine medical/legal dialogues with preparation", "3": "Handles complex technical content with good accuracy", "4": "Seamlessly interprets high-stakes, emotionally charged sessions", "5": "Expert-level performance across all domains and registers"}'::jsonb),

('Consecutive Interpreting', 'linguistic', 'Note-taking and interpreting after speaker pauses',
 '{"1": "Can relay short messages with notes", "2": "Can handle standard consultations with accurate note-taking", "3": "Interprets complex monologues with excellent retention", "4": "Maintains accuracy through lengthy legal/medical testimony", "5": "Flawless performance with extended technical discourse"}'::jsonb),

('Medical Terminology', 'linguistic', 'Understanding and interpreting medical vocabulary and concepts',
 '{"1": "Knows basic anatomy and common conditions", "2": "Comfortable with routine diagnoses and procedures", "3": "Handles specialist consultations (oncology, cardiology)", "4": "Interprets complex treatment plans and research discussions", "5": "Expert in all medical specialties and clinical research"}'::jsonb),

('Legal Terminology', 'linguistic', 'Understanding and interpreting legal vocabulary and procedures',
 '{"1": "Knows basic legal rights and court roles", "2": "Handles arraignments and simple civil cases", "3": "Interprets depositions and expert testimony", "4": "Works complex trials and appellate proceedings", "5": "Expert across all legal domains including contracts and IP"}'::jsonb)

ON CONFLICT DO NOTHING;

-- Ethical Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Role-Space Management', 'ethical', 'Maintaining appropriate boundaries and professional role',
 '{"1": "Aware of interpreter role vs. advocate/counselor", "2": "Consistently maintains boundaries in routine settings", "3": "Navigates gray areas and consumer pressure with skill", "4": "Models ethical decision-making for colleagues", "5": "Expert consultant on ethics and role-space dilemmas"}'::jsonb),

('Cultural Mediation', 'ethical', 'Bridging cultural gaps while maintaining neutrality',
 '{"1": "Aware of cultural differences in communication", "2": "Explains cultural context when necessary", "3": "Skillfully mediates cultural misunderstandings", "4": "Anticipates cultural conflicts and intervenes appropriately", "5": "Expert in cross-cultural communication and training"}'::jsonb),

('Confidentiality Management', 'ethical', 'Protecting sensitive information and navigating disclosure',
 '{"1": "Understands basic confidentiality requirements", "2": "Consistently applies confidentiality in practice", "3": "Handles complex disclosure scenarios (mandated reporting)", "4": "Advises on confidentiality policies and protocols", "5": "Expert on confidentiality across all domains and jurisdictions"}'::jsonb)

ON CONFLICT DO NOTHING;

-- Emotional Regulation Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Vicarious Trauma Management', 'emotional-regulation', 'Processing and recovering from exposure to traumatic content',
 '{"1": "Aware of vicarious trauma risks", "2": "Uses basic self-care and debriefing", "3": "Implements structured recovery protocols", "4": "Maintains resilience through sustained trauma exposure", "5": "Mentors others and contributes to trauma-informed training"}'::jsonb),

('Emotional Residue Processing', 'emotional-regulation', 'Managing emotional carryover between assignments',
 '{"1": "Notices emotional reactions after difficult assignments", "2": "Uses grounding techniques between sessions", "3": "Implements systematic emotional clearing routines", "4": "Maintains emotional neutrality across back-to-back sessions", "5": "Expert in emotional regulation and teaches others"}'::jsonb),

('Burnout Prevention', 'emotional-regulation', 'Recognizing and preventing long-term exhaustion',
 '{"1": "Aware of burnout signs and symptoms", "2": "Monitors workload and takes breaks", "3": "Proactively adjusts schedule and boundaries", "4": "Sustains long-term career without burnout", "5": "Mentors others on sustainable career practices"}'::jsonb)

ON CONFLICT DO NOTHING;

-- Technical Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Remote Interpreting Technology', 'technical', 'Using video/phone interpreting platforms effectively',
 '{"1": "Can join basic video calls and manage audio", "2": "Proficient with major VRI platforms", "3": "Troubleshoots technical issues independently", "4": "Optimizes setup for quality and ergonomics", "5": "Trains others and advises on platform selection"}'::jsonb),

('Note-Taking Systems', 'technical', 'Developing efficient note-taking methods for consecutive interpreting',
 '{"1": "Takes basic linear notes", "2": "Uses symbols and abbreviations consistently", "3": "Employs advanced notation systems", "4": "Custom system optimized for personal workflow", "5": "Teaches note-taking and develops new methods"}'::jsonb)

ON CONFLICT DO NOTHING;
