# Democracy x AI Problem Statement - Revised Draft

## Theme
Information Integrity

## Pair
- Timothy Khalayi, Kirinyaga University - Contributed to research on affected population, scale of the problem, causes, and responsible computing considerations.
- Faith Karango, Kirinyaga University - Contributed to research on existing initiatives/gaps, 5 WHYs analysis, and drafting the final problem statement.

## Part 1 - Research Your Problem

### Question 1 - Who is affected by this problem, and how many people?
First-time voters and young civic participants aged 18-35 in Nairobi informal settlements and nearby peri-urban wards who rely on WhatsApp, Facebook, and Instagram for political news are heavily exposed to unverified political content. During the 2022 election period, the MAPEMA Consortium documented over 550,000 toxic posts on Facebook alone, showing the scale of misleading content that reaches this audience.

Source: Code for Africa (MAPEMA Consortium) (2023) - https://medium.com/code-for-africa/unmasking-hate-speech-in-kenyan-elections-with-ai-and-collaboration-576e37d4ccb5

### Question 2 - What are the main causes of this problem?
Three causes stand out: (1) social media systems reward engagement more than accuracy, so sensational false claims spread quickly; (2) cheap AI tools make deepfakes and synthetic political content easier to produce; and (3) there is no real-time, Swahili-first verification tool integrated into the places where users actually encounter content. The most addressable cause for a student-built solution is the third, because it is a technical gap at the point of consumption.

Source: Reuters Institute Digital News Report 2025 - Kenya - https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/kenya

### Question 3 - How serious or widespread is this problem?
Globally, misinformation remains a major concern in digital news environments. In Kenya, MAPEMA documented over 550,000 toxic posts on Facebook during the 2022 election period, with manipulated images and other synthetic content becoming more visible. In Nairobi informal settlements and similar mobile-first communities, young users regularly receive political content through chat apps and social media before they can check whether it is real, and the problem is likely to grow as AI-generated media becomes easier to create and share.

Source: Code for Africa (MAPEMA Consortium) (2023) - https://medium.com/code-for-africa/unmasking-hate-speech-in-kenyan-elections-with-ai-and-collaboration-576e37d4ccb5
Source: Reuters Institute Digital News Report 2025 - Kenya - https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/kenya

### Question 4 - What is already being done, and what gap remains?
Africa Check, PesaCheck, and the MAPEMA Consortium monitor misinformation, fact-check claims, and publish debunks. However, their outputs are mostly English-language, website-based, and reactive after the content has already spread. They do not provide instant verification inside the social media or messaging apps where young users first see suspicious claims. The remaining gap is a Swahili-first, mobile-first tool that gives ordinary users immediate help before they re-share content.

Source: Africa Check Kenya Election Information Hub - https://africacheck.org/kenya-election-information-hub

### Question 5 - What responsible computing considerations must you think about?
1. Bias: A tool trained mainly on English or urban data may misread Kenyan Swahili, slang, or regional political language.
2. Misuse: A verification tool could be abused to suppress legitimate political speech if it is designed too aggressively.
3. Access: If the tool requires high data usage or a modern smartphone, the people most exposed to misinformation may not be able to use it.
4. Language: The interface and outputs must be simple Swahili, not English-first, so that low-literacy users can understand the result quickly.

## Part 2 - Narrow to a Specific Problem Using the 5 WHYs

### General problem
Young first-time voters in Nairobi informal settlements and nearby peri-urban wards are exposed to political misinformation and synthetic media on social platforms during civic moments.

### Why 1
Because misleading content spreads through WhatsApp and Facebook faster than corrections can catch up.

### Why 2
Because users do not have an immediate way to verify a claim in simple Swahili at the moment they receive it.

### Why 3
Because existing fact-checking services are mostly published after the fact on websites and in English, instead of being embedded in the mobile sharing flow.

### Why 4
Because current tools assume users can search the web, switch languages, and spend data to check a claim later.

### Why 5
Because there is no lightweight, Swahili-first verification workflow built for mobile-first civic users who need an answer before they re-share.

### Specific problem
There is no accessible, low-data, Swahili-first AI tool that lets first-time voters in Nairobi informal settlements verify political claims, images, or videos at the moment they receive them on social media before resharing.

## Part 3 - Check the Specific Problem Against Six Criteria

### Relevant
Yes. It directly fits the Information Integrity theme and targets a Kenyan civic context where misinformation affects democratic participation.

### Evidence
Yes. The MAPEMA Consortium documented over 550,000 toxic posts during the 2022 elections, and Reuters Institute reports show that misinformation is a persistent concern.

### Solvable
Yes. A student team can realistically prototype a lightweight chatbot, browser extension, or verification interface that checks claims against trusted sources and gives a simple Swahili response.

### Impact
Yes. If solved, it could reduce harmful re-sharing and help young voters make more informed decisions during elections.

### Responsible
Yes. The solution can be designed with low-data usage, simple Swahili, and safeguards against dialect bias and misuse.

### Team energy
Yes. Both team members are motivated to work on a practical civic information problem that affects real communities.

## Part 4 - Problem Statement
Young first-time voters in Nairobi informal settlements and nearby peri-urban wards face widespread exposure to misinformation, deepfakes, and synthetic political content on social media, evidenced by more than 550,000 toxic posts documented by the MAPEMA Consortium during Kenya's 2022 elections. This problem is primarily caused by the absence of a real-time, Swahili-first verification workflow integrated into the mobile platforms where users encounter and re-share content, supported by the gap between existing fact-checking services and the last mile of delivery. Despite the work of Africa Check, PesaCheck, and MAPEMA in monitoring and debunking misinformation, their outputs are mostly English, website-based, and reactive rather than immediate. A lightweight AI verification tool that responds in simple Swahili at the moment a user receives suspicious content could reduce harmful re-sharing ahead of the 2027 elections, while ensuring the model is tested on Kenyan Swahili from different regions to reduce dialect bias.
