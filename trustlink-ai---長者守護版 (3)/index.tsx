<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
    <title>TrustLink AI - 長者守護</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&display=swap" rel="stylesheet">
    <style>
      :root {
        --ios-bg: #000000;
        --ios-card: #1c1c1e;
        --ios-card-highlight: #2c2c2e;
        --ios-blue: #0a84ff;
        --ios-red: #ff453a;
        --ios-green: #30d158;
        --ios-orange: #ff9f0a;
        --ios-gray: #8e8e93;
      }
      body {
        font-family: 'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif;
        background-color: var(--ios-bg);
        color: #ffffff;
        -webkit-font-smoothing: antialiased;
        font-size: 18px; /* Larger base font size */
      }
      
      /* Accessibility utilities */
      .text-huge { font-size: 2rem; line-height: 1.2; }
      .text-big { font-size: 1.5rem; line-height: 1.3; }
      .text-body { font-size: 1.125rem; line-height: 1.5; }
      
      .ios-card {
        background-color: var(--ios-card);
        border-radius: 20px;
      }
      .ios-btn {
        transition: transform 0.1s;
      }
      .ios-btn:active {
        transform: scale(0.96);
        opacity: 0.8;
      }
    </style>
</head>
  <body>
    <div id="root"></div>
    <!-- FIXED: Use relative path ./index.tsx so it works in /spare/ subfolder -->
    <script type="module" src="./index.tsx"></script>
  </body>
</html>
