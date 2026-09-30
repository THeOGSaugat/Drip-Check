export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #f5f4f0; color: #112250; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #535b71; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.55rem 1.1rem; border-radius: 999px; font: inherit; font-weight: 600; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: transform .2s cubic-bezier(.2,.8,.2,1), box-shadow .2s, background-color .2s; }
      a:hover, button:hover { transform: translateY(-2px); }
      a:active, button:active { transform: translateY(0); }
      .primary { background: #3b507d; color: #f5f4f0; box-shadow: 0 1px 1px rgb(17 34 80 / .1), 0 2px 4px -1px rgb(17 34 80 / .14); }
      .primary:hover { background: #2f4370; box-shadow: 0 2px 3px rgb(17 34 80 / .1), 0 10px 22px -8px rgb(17 34 80 / .4); }
      .secondary { background: transparent; color: #112250; border-color: rgb(17 34 80 / .22); }
      .secondary:hover { border-color: #3b507d; color: #3b507d; background: rgb(231 226 206 / .45); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
