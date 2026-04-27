const fs = require('fs');
const file = '/Users/pranav/Desktop/Pranav/abc/full-stack-ml-projects/edubond-mobile/src/screens/auth/RegisterScreen.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add COMMON_COLLEGES
const COMMON_COLLEGES_CODE = `
const COMMON_COLLEGES = [
    'Indian Institute of Technology (IIT) Delhi',
    'Indian Institute of Technology (IIT) Bombay',
    'Indian Institute of Technology (IIT) Madras',
    'Birla Institute of Technology and Science (BITS) Pilani',
    'National Institute of Technology (NIT) Trichy',
    'Delhi Technological University (DTU)',
    'Vellore Institute of Technology (VIT)',
    'Stanford University',
    'Massachusetts Institute of Technology (MIT)',
    'Harvard University',
];

export const RegisterScreen`;
content = content.replace('export const RegisterScreen', COMMON_COLLEGES_CODE);

// 2. Fetch Colleges
const FETCH_COLLEGES_REPLACE = `const response: any = await authApi.getColleges();
                let fetched = response?.colleges || [];
                const merged = Array.from(new Set([...fetched, ...COMMON_COLLEGES]));
                setColleges(merged);
                setFilteredColleges(merged);`;
content = content.replace(/const response: any = await authApi\.getColleges\(\);\s*if \(response\?\.colleges\) \{\s*setColleges\(response\.colleges\);\s*\}/s, FETCH_COLLEGES_REPLACE);

// 3. Update field
const UPDATE_FIELD_REPLACE = `        if (field === 'institution') {
            if (value.trim()) {
                const filtered = colleges.filter(c => c.toLowerCase().includes(value.toLowerCase()));
                setFilteredColleges(filtered);
                setShowDropdown(filtered.length > 0 && !colleges.some(c => c.toLowerCase() === value.trim().toLowerCase()));
            } else {
                setFilteredColleges(colleges);
                setShowDropdown(true);
            }
        }`;
content = content.replace(/if \(field === 'institution'\) \{[\s\S]*?setShowDropdown\(false\);\s*setFilteredColleges\(\[\]\);\s*\}\s*\}/, UPDATE_FIELD_REPLACE);


// 4. Input onFocus
const INPUT_REPLACE = `label="Institution"
                            value={formData.institution}
                            onChangeText={(value) => updateField('institution', value)}
                            onFocus={() => {
                                setFilteredColleges(formData.institution ? colleges.filter(c => c.toLowerCase().includes(formData.institution.toLowerCase())) : colleges);
                                setShowDropdown(true);
                            }}
                            placeholder="Enter your institution"`;
content = content.replace(/label="Institution"\s*value=\{formData\.institution\}\s*onChangeText=\{\(value\) => updateField\('institution', value\)\}\s*placeholder="Enter your institution"/, INPUT_REPLACE);

// 5. ScrollView
content = content.replace('<ScrollView contentContainerStyle={styles.scrollContent}>', '<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">');

// 6. View zIndex relative
content = content.replace('<View style={{ zIndex: 10 }}>', '<View style={{ zIndex: 10, position: \'relative\' }}>');

// 7. Dropdown styles
const STYLES_REPLACE = `    dropdownContainer: {
        position: 'absolute',
        top: 85,
        left: 0,
        right: 0,
        backgroundColor: COLORS.backgroundLight,
        borderRadius: SIZES.radiusMd,
        borderWidth: 1,
        borderColor: COLORS.border,
        maxHeight: 200,
        zIndex: 1000,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },`;
content = content.replace(/dropdownContainer: \{[\s\S]*?\},/, STYLES_REPLACE);

fs.writeFileSync(file, content);
console.log('patched successfully');
