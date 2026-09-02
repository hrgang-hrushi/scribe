const fs = require('fs');
let code = fs.readFileSync('src/app/classes/[classId]/page.tsx', 'utf8');

// Remove abstract blobs
code = code.replace(/<div className="absolute top-0 right-0 w-32 h-32 bg-white\/20 rounded-full blur-2xl -mr-10 -mt-10"><\/div>/g, '');
code = code.replace(/<div className="absolute bottom-0 left-0 w-24 h-24 bg-black\/10 rounded-full blur-xl -ml-5 -mb-5"><\/div>/g, '');

fs.writeFileSync('src/app/classes/[classId]/page.tsx', code);
