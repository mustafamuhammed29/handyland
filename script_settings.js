const fs = require('fs');
const content = fs.readFileSync('c:/Users/musta/Desktop/handyland/backend/admin/src/pages/SettingsManager.tsx', 'utf8');

const extractTab = (startFlag, endFlag, name, extraProps, filename, imports) => {
    const startIdx = content.indexOf(startFlag);
    const endIdx = content.indexOf(endFlag);
    
    // The tab content is everything between the startFlag and endFlag, but we must remove the closing parenthesis/brace if it's there.
    let tabContent = content.substring(startIdx + startFlag.length, endIdx).trim();
    if (tabContent.endsWith('}')) tabContent = tabContent.substring(0, tabContent.length - 1).trim();
    if (tabContent.endsWith(')')) tabContent = tabContent.substring(0, tabContent.length - 1).trim();

    const newComponent = `import React from 'react';\n${imports}\n\nexport const ${name} = ({ ${extraProps} }: any) => {\n    return (\n        <>\n            ${tabContent}\n        </>\n    );\n};\n`;
    fs.writeFileSync(`c:/Users/musta/Desktop/handyland/backend/admin/src/pages/settings/${filename}.tsx`, newComponent, 'utf8');
};

extractTab('{activeTab === \'valuation\' && (', '{activeTab === \'content\' && (', 'ValuationSettingsTab', 'settings, handleChange', 'ValuationSettingsTab', 'import { Trash2 } from \'lucide-react\';');
extractTab('{activeTab === \'banner\' && (', '{activeTab === \'promo\' && (', 'BannerSettingsTab', 'settings, handleChange', 'BannerSettingsTab', 'import { AlertCircle } from \'lucide-react\';');
extractTab('{activeTab === \'email-templates\' && (', '{activeTab === \'general\' &&', 'EmailTemplatesTab', 'settings, handleChange, emailPreview, setEmailPreview, editHtml, setEditHtml, testEmail, setTestEmail, sendingTest, setSendingTest, renderWithMockData, handleSaveEmailTemplate, handleSendTestEmail', 'EmailTemplatesTab', 'import { Save, Mail, LayoutTemplate, X, CheckCircle, Upload } from \'lucide-react\';\nimport ReactQuill from \'react-quill-new\';\nimport \'react-quill-new/dist/quill.snow.css\';\nimport DOMPurify from \'dompurify\';');

// Now replace in SettingsManager.tsx
let newMain = content;
const removeBlock = (startF, endF) => {
    const s = newMain.indexOf(startF);
    const e = newMain.indexOf(endF);
    newMain = newMain.substring(0, s) + newMain.substring(e);
};

// Instead of removing blindly, just replace the start string with the component invocation and slice to end string.
const replaceBlock = (startF, endF, replacement) => {
    const s = newMain.indexOf(startF);
    const e = newMain.indexOf(endF);
    newMain = newMain.substring(0, s) + replacement + '\n' + newMain.substring(e);
};

replaceBlock('{activeTab === \'valuation\' && (', '{activeTab === \'content\' && (', '{activeTab === \'valuation\' && <ValuationSettingsTab settings={settings} handleChange={handleChange} />}');
replaceBlock('{activeTab === \'banner\' && (', '{activeTab === \'promo\' && (', '{activeTab === \'banner\' && <BannerSettingsTab settings={settings} handleChange={handleChange} />}');
replaceBlock('{activeTab === \'email-templates\' && (', '{activeTab === \'general\' &&', '{activeTab === \'email-templates\' && <EmailTemplatesTab settings={settings} handleChange={handleChange} emailPreview={emailPreview} setEmailPreview={setEmailPreview} editHtml={editHtml} setEditHtml={setEditHtml} testEmail={testEmail} setTestEmail={setTestEmail} sendingTest={sendingTest} setSendingTest={setSendingTest} renderWithMockData={renderWithMockData} handleSaveEmailTemplate={handleSaveEmailTemplate} handleSendTestEmail={handleSendTestEmail} />}');

// Add imports
newMain = 'import { ValuationSettingsTab } from \'./settings/ValuationSettingsTab\';\nimport { BannerSettingsTab } from \'./settings/BannerSettingsTab\';\nimport { EmailTemplatesTab } from \'./settings/EmailTemplatesTab\';\n' + newMain;

fs.writeFileSync('c:/Users/musta/Desktop/handyland/backend/admin/src/pages/SettingsManager.tsx', newMain, 'utf8');
console.log('Done extraction');
