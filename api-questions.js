export default async function handler(request, response) {
    const subject = request.query.subject || 'english';
    
    // Grabs your secret key from Vercel settings
    const apiKey = process.env.ALOC_API_KEY; 

    // Requesting 40 questions at once
    const url = `https://questions.aloc.com.ng/api/q/40?subject=${subject}`;

    try {
        const alocResponse = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "AccessToken": apiKey 
            }
        });

        if (!alocResponse.ok) {
            throw new Error(`ALOC API responded with status: ${alocResponse.status}`);
        }

        const data = await alocResponse.json();
        
        // Send data back to your frontend
        response.status(200).json(data);

    } catch (error) {
        console.error("API Error:", error);
        response.status(500).json({ error: "Failed to fetch questions" });
    }
}
