const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'server', 'app-render', 'entry-base.js');
if (fs.existsSync(target)) {
  let content = fs.readFileSync(target, 'utf8');
  if (content.includes("if (process.env.NODE_ENV === 'development') {")) {
    content = content.replace("if (process.env.NODE_ENV === 'development') {", "if (false) {");
    content = content.replace("let SegmentViewNode = ()=>null;", "let SegmentViewNode = ({ children })=>children;");
    fs.writeFileSync(target, content);
    console.log('[patch-next] Successfully patched entry-base.js');
  }
}
