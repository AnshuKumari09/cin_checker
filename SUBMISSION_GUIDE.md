# Submission guide (Hinglish)

Deadline: **27 Nov 2026**. Dono assignments mandatory hain.

## Step 0: Assignment 1 (form)
https://forms.gle/a8PiRisT578bAeZw8 → 20-30 min, apne words me, honest likho.

## Step 1: Code ko GitHub pe daalo
1. github.com/new → repo name `cin-llpin-checker`, **Public**, README mat add karo.
2. Is folder me terminal kholo:
```bash
git init
git add .
git commit -m "CIN & LLPIN checker"
git branch -M main
git remote add origin https://github.com/<USERNAME>/cin-llpin-checker.git
git push -u origin main
```

## Step 2: Live karo (GitHub Pages)
Repo → Settings → Pages → Source: Deploy from a branch → `main` / `/ (root)` → Save.
1-2 min baad link: `https://<USERNAME>.github.io/cin-llpin-checker/`
Link ko phone pe bhi khol ke dekho. README me live link bhi paste kar do.

## Step 3: AI transcripts (mandatory)
Is Claude chat ke share link nikalo: chat ke upar **Share** → link copy.
Agar aur kisi AI se bhi baat ki to uske bhi links. Edit mat karna.

## Step 4: Video (max 10 min, screen + face + voice)
Loom / OBS / Google Meet recording. Ye order rakho:
1. (0:00-1:00) Intro + page live dikhao, example button.
2. (1:00-3:00) Tricky inputs: galat length, galat state, future year, AAA1234, khaali, 500 lines. Phone view bhi (browser DevTools → mobile).
3. (3:00-4:30) Ek design decision: **rang-birange CIN hisse** + empty state.
4. (4:30-8:00) Code walkthrough: `cin-parser.js` (parseCIN) → `app.js` (render) → tests.
5. (8:00-10:00) **AI ne kahan galti ki + tumne kaise pakda** (neeche dekho).

### "AI ne galti ki" ke liye ideas (sach me check karke batao)
- State codes: Uttarakhand UR ya UK, Telangana TG ya TS? MCA ki list se verify karo.
- Type codes ke matlab (FTC, FLC, ULL, ULT) MCA se verify karo.
- Private company "L" nahi ho sakti: ye rule AI ke first answer me missing ho sakta hai, test se pakdo.
- Jo bhi sach me tumne notice kiya wahi bolo. Jhooth mat bolna: next round me live pooche jayenge.

## Step 5: Email
To: sayukta@filesure.in  
CC: tushar@filesure.in  
Subject: `Tech Support 2nd Assignment Submission_<Your Full Name> - FileSure`  
(Isi email thread ka reply bhi kar sakte ho, PDF kehta hai "email this came from".)

Body me: 1) Live link 2) GitHub link 3) AI transcript links 4) Video link (Drive/YouTube unlisted, access "anyone with link") 5) Form submit ho chuka hai.

## Final checklist
- [ ] Form submit
- [ ] Live link phone + laptop pe chal raha
- [ ] Repo public
- [ ] Transcript links open ho rahe (logged-out window me test)
- [ ] Video link open ho raha
- [ ] Subject line exact
- [ ] CC me tushar@filesure.in

## Next round ke liye taiyari
Live me tumhare page me kuch change karwayenge. Isliye code samjho: `parseCIN` ke rules, `TYPES`/`STATES` me naya code kaise add hota hai, `render()` kaise rows banata hai.
