const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');
const fs = require('fs');

const project = new Project({
    tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

const enLocales = JSON.parse(fs.readFileSync(path.join(__dirname, 'src', 'locales', 'en.json'), 'utf8'));
// Create a reverse mapping
const stringToKey = {};
for (const [key, value] of Object.entries(enLocales)) {
    stringToKey[value.toLowerCase()] = key;
}

const sourceFiles = project.getSourceFiles("src/**/*.tsx");

let totalReplaced = 0;

sourceFiles.forEach(sourceFile => {
    let fileModified = false;
    let needsImport = false;

    // 1. Find all JSX Text and JSX Expression strings
    const jsxTexts = sourceFile.getDescendantsOfKind(SyntaxKind.JsxText);
    
    jsxTexts.forEach(jsxText => {
        const text = jsxText.getLiteralText().trim();
        if (!text) return;

        // Check if the text matches any of our known strings (exact match ignoring case for simplicity)
        const matchKey = stringToKey[text.toLowerCase()];
        if (matchKey) {
            jsxText.replaceWithText(`{t('${matchKey}')}`);
            fileModified = true;
            needsImport = true;
            totalReplaced++;
        }
    });

    const stringLiterals = sourceFile.getDescendantsOfKind(SyntaxKind.StringLiteral);
    stringLiterals.forEach(str => {
        // Only replace strings that are JSX Attributes or inside elements (not imports)
        const parent = str.getParent();
        if (parent.getKind() === SyntaxKind.JsxAttribute) {
            const text = str.getLiteralText().trim();
            const matchKey = stringToKey[text.toLowerCase()];
            if (matchKey) {
                str.replaceWithText(`{t('${matchKey}')}`);
                fileModified = true;
                needsImport = true;
                totalReplaced++;
            }
        }
    });

    if (fileModified && needsImport) {
        // Check if useTranslation is already imported
        const hasUseTranslation = sourceFile.getImportDeclarations().some(imp => 
            imp.getModuleSpecifierValue() === 'react-i18next' && 
            imp.getNamedImports().some(n => n.getName() === 'useTranslation')
        );

        if (!hasUseTranslation) {
            sourceFile.addImportDeclaration({
                namedImports: ['useTranslation'],
                moduleSpecifier: 'react-i18next'
            });
        }

        // Add the hook inside the component if not there
        // This is tricky because we need to find the React component
        const functions = sourceFile.getFunctions();
        const arrowFuncs = sourceFile.getVariableDeclarations().filter(v => 
            v.getInitializerIfKind(SyntaxKind.ArrowFunction)
        );

        const addHook = (block) => {
            if (block && block.getKind() === SyntaxKind.Block) {
                const statements = block.getStatements();
                const hasHook = statements.some(s => s.getText().includes('useTranslation'));
                if (!hasHook) {
                    block.insertStatements(0, 'const { t } = useTranslation();');
                }
            }
        };

        functions.forEach(f => addHook(f.getBody()));
        arrowFuncs.forEach(v => {
            const init = v.getInitializerIfKind(SyntaxKind.ArrowFunction);
            if (init) addHook(init.getBody());
        });
    }
});

console.log(`Replacing ${totalReplaced} instances... saving files...`);
project.saveSync();
console.log('Done.');
