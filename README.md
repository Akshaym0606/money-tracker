# Money Tracker

A mobile-first personal money tracker built with plain HTML, CSS and JavaScript.

## Features
- Cumulative earnings: earnings carry forward and never decrease when you spend.
- Current balance: opening balance minus groceries, other expenses and money lent, plus returned loans.
- Dedicated Groceries section.
- Dedicated Money Lent section with "Mark returned".
- Other Expenses.
- Daily transaction history.
- LocalStorage persistence, so data remains in the browser on the same device/browser.
- Responsive dark UI inspired by the supplied reference image.

## Run locally
Open `index.html` in a browser.

## Publish with GitHub Pages
1. Create a new GitHub repository.
2. Upload `index.html`, `styles.css`, and `app.js`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save. GitHub will give you a website URL.

## Important accounting logic
Earnings are only a cumulative record:
`earnings = previous earnings + new earnings`

Balance is independent:
`balance = opening balance - groceries - other expenses - money lent + returned loans`

Adding an earning does NOT increase the current balance.
