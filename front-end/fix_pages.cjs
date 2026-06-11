const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/TermsAndConditions.tsx',
    'src/components/InfoPage.tsx',
    'src/components/GenericPage.tsx'
];

for (let file of files) {
    const fullPath = path.join('c:/Users/musta/Desktop/handyland/front-end', file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        if (!content.includes('import ReactMarkdown from')) {
            content = content.replace("import { api } from '../utils/api';", "import { api } from '../utils/api';\nimport ReactMarkdown from 'react-markdown';\nimport rehypeRaw from 'rehype-raw';");
            
            const target = `<div className="ql-writing-format">
                            <div className="ql-snow">
                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: content }} />
                            </div>
                        </div>`;
            const replacement = `<div className="prose dark:prose-invert max-w-none prose-blue">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {content}
                            </ReactMarkdown>
                        </div>`;
            
            // Also handle if generic page uses page.content instead of content
            const target2 = `<div className="ql-writing-format">
                            <div className="ql-snow">
                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: page.content }} />
                            </div>
                        </div>`;
            const replacement2 = `<div className="prose dark:prose-invert max-w-none prose-blue">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {page.content}
                            </ReactMarkdown>
                        </div>`;

            // Wait, InfoPage.tsx might use `pageData.content`
            const target3 = `<div className="ql-writing-format">
                                <div className="ql-snow">
                                    <div className="ql-editor" dangerouslySetInnerHTML={{ __html: pageData.content }} />
                                </div>
                            </div>`;
            const replacement3 = `<div className="prose dark:prose-invert max-w-none prose-blue">
                                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                    {pageData.content}
                                </ReactMarkdown>
                            </div>`;

            content = content.replace(target, replacement);
            content = content.replace(target2, replacement2);
            content = content.replace(target3, replacement3);
            
            // Special regex fallback if spacing is different
            content = content.replace(/<div className="ql-writing-format">[\s\S]*?<div className="ql-editor" dangerouslySetInnerHTML=\{\{ __html: (content|page\.content|pageData\.content) \}\} \/>[\s\S]*?<\/div>\s*<\/div>/g, 
            `<div className="prose dark:prose-invert max-w-none prose-blue">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                                {$1}
                            </ReactMarkdown>
                        </div>`);

            fs.writeFileSync(fullPath, content);
            console.log(`Updated ${file}`);
        }
    }
}
