const fs = require('fs');
const https = require('https');

// Configuration
// Hearts2Hearts Official Channel ID
const CHANNEL_ID = 'UC4U5q2zKXYX8iY0Q42T33yQ'; // Extracted from source code
const DATA_FILE = '../../data.js'; // Relative to .github/scripts/

function fetchRss(channelId) {
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    return new Promise((resolve, reject) => {
        https.get(rssUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseRss(xml) {
    const videos = [];
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;

    while ((match = entryRegex.exec(xml)) !== null) {
        const entry = match[1];
        
        const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const dateMatch = entry.match(/<published>(.*?)<\/published>/);

        if (idMatch && titleMatch && dateMatch) {
            // Unescape XML entities in title (basic)
            let title = titleMatch[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'");
                
            // Format date to YYYY-MM-DD
            const date = dateMatch[1].split('T')[0];

            videos.push({
                id: idMatch[1],
                title: title,
                date: date,
                category: "New" // Default category as requested
            });
        }
    }
    return videos;
}

function updateDataFile(newVideos) {
    const filePath = require('path').join(__dirname, DATA_FILE);
    let dataContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract existing IDs so we don't add duplicates
    const existingIds = new Set();
    const idRegex = /id:\s*["']([^"']+)["']/g;
    let match;
    while ((match = idRegex.exec(dataContent)) !== null) {
        existingIds.add(match[1]);
    }
    
    // Filter out videos we already have
    const videosToAdd = newVideos.filter(v => !existingIds.has(v.id));
    
    if (videosToAdd.length === 0) {
        console.log("No new videos found.");
        return false;
    }
    
    console.log(`Found ${videosToAdd.length} new videos to add.`);
    
    // Format the new video objects
    let newEntriesStr = "";
    // Reversing so that when we prepend, the chronological order is maintained (RSS gives newest first)
    videosToAdd.reverse().forEach(v => {
        // Escape quotes inside title to prevent breaking JS
        const safeTitle = v.title.replace(/"/g, '\\"');
        newEntriesStr += `    {\n        id: "${v.id}",\n        title: "${safeTitle}",\n        date: "${v.date}",\n        category: "${v.category}"\n    },\n`;
    });
    
    // Insert new entries right after the opening bracket of the array
    // Assuming data.js starts with: const videoArchive = [ 
    const insertPoint = dataContent.indexOf('const videoArchive = [') + 'const videoArchive = ['.length;
    
    if (insertPoint > 'const videoArchive = ['.length) { // Verify it was found
         dataContent = dataContent.slice(0, insertPoint) + '\n' + newEntriesStr + dataContent.slice(insertPoint);
         fs.writeFileSync(filePath, dataContent, 'utf8');
         console.log("data.js successfully updated.");
         return true;
    } else {
         console.error("Could not find insertion point in data.js");
         return false;
    }
}

async function run() {
    try {
        console.log(`Fetching RSS Feed for Channel ID: ${CHANNEL_ID}`);
        const rssXml = await fetchRss(CHANNEL_ID);
        
        console.log("Parsing videos...");
        const videos = parseRss(rssXml);
        
        console.log("Updating data.js...");
        updateDataFile(videos); // We don't strictly need to fail the action if there are no new videos
        
    } catch (error) {
        console.error("Error running update script:", error);
        process.exit(1);
    }
}

run();
