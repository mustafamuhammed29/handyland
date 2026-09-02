const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project({
    tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
});

const sourceFiles = project.getSourceFiles("src/**/*.tsx");

let targetBlankFixed = 0;
let srOnlyFixed = 0;
let inputModeFixed = 0;
let spanFixed = 0;

sourceFiles.forEach(sourceFile => {
    let modified = false;

    // Fix target="_blank"
    const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement).concat(
        sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
    );

    jsxElements.forEach(element => {
        const tagName = element.getTagNameNode().getText();
        
        if (tagName === 'a' || tagName === 'Link') {
            const targetAttr = element.getAttribute('target');
            const relAttr = element.getAttribute('rel');
            
            if (targetAttr) {
                let isBlank = false;
                if (targetAttr.getKind() === SyntaxKind.JsxAttribute) {
                    const init = targetAttr.getInitializer();
                    if (init && init.getKind() === SyntaxKind.StringLiteral && init.getLiteralText() === '_blank') {
                        isBlank = true;
                    }
                }
                
                if (isBlank && !relAttr) {
                    element.addAttribute({
                        name: 'rel',
                        initializer: '"noopener noreferrer"'
                    });
                    modified = true;
                    targetBlankFixed++;
                }
            }
        }
        
        // Fix span onClick
        if (tagName === 'span') {
            const onClickAttr = element.getAttribute('onClick');
            if (onClickAttr) {
                element.getTagNameNode().replaceWithText('button');
                // Also need to fix closing tag if it exists
                const parent = element.getParent();
                if (parent.getKind() === SyntaxKind.JsxElement) {
                    const closing = parent.getClosingElement();
                    if (closing) {
                        closing.getTagNameNode().replaceWithText('button');
                    }
                }
                
                // Add type="button"
                if (!element.getAttribute('type')) {
                    element.addAttribute({
                        name: 'type',
                        initializer: '"button"'
                    });
                }
                modified = true;
                spanFixed++;
            }
        }

        // Fix inputs
        if (tagName === 'input') {
            const typeAttr = element.getAttribute('type');
            const nameAttr = element.getAttribute('name');
            const idAttr = element.getAttribute('id');
            const inputModeAttr = element.getAttribute('inputMode');
            
            let nameVal = '';
            if (nameAttr && nameAttr.getKind() === SyntaxKind.JsxAttribute) {
                const init = nameAttr.getInitializer();
                if (init && init.getKind() === SyntaxKind.StringLiteral) {
                    nameVal = init.getLiteralText().toLowerCase();
                }
            }
            if (!nameVal && idAttr && idAttr.getKind() === SyntaxKind.JsxAttribute) {
                const init = idAttr.getInitializer();
                if (init && init.getKind() === SyntaxKind.StringLiteral) {
                    nameVal = init.getLiteralText().toLowerCase();
                }
            }

            if (!inputModeAttr && nameVal) {
                if (['phone', 'tel', 'zip', 'postal', 'quantity', 'amount', 'price', 'card', 'cvv', 'expiry'].some(k => nameVal.includes(k))) {
                    element.addAttribute({
                        name: 'inputMode',
                        initializer: '"numeric"'
                    });
                    
                    if (nameVal.includes('phone') || nameVal.includes('tel')) {
                        if (typeAttr && typeAttr.getKind() === SyntaxKind.JsxAttribute) {
                            const init = typeAttr.getInitializer();
                            if (init && init.getKind() === SyntaxKind.StringLiteral && init.getLiteralText() !== 'tel') {
                                typeAttr.setInitializer('\"tel\"');
                            }
                        }
                    }
                    modified = true;
                    inputModeFixed++;
                }
            }
        }
        
        // Add loading="lazy" to imgs
        if (tagName === 'img') {
            const loadingAttr = element.getAttribute('loading');
            if (!loadingAttr) {
                element.addAttribute({
                    name: 'loading',
                    initializer: '"lazy"'
                });
                modified = true;
            }
        }

        // Add sr-only to Icon buttons
        if (tagName === 'button') {
            const children = element.getParent().getChildren();
            let hasText = false;
            children.forEach(c => {
                if (c.getKind() === SyntaxKind.JsxText && c.getText().trim() !== '') { hasText = true; }
                if (c.getKind() === SyntaxKind.JsxExpression) { hasText = true; }
            });
            if (!hasText) {
                const ariaLabel = element.getAttribute('aria-label');
                if (ariaLabel) {
                    // Could add sr-only span here, but since it has aria-label, it's accessible
                }
            }
        }
    });
});

console.log(`Fixed target="_blank": ${targetBlankFixed}`);
console.log(`Fixed span onClick: ${spanFixed}`);
console.log(`Fixed inputMode: ${inputModeFixed}`);
console.log('Saving...');
project.saveSync();
console.log('Done.');

