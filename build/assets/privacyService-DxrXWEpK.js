import{n as e,t}from"./safe-fetch-ituBjceh.js";import{_ as n}from"./index-CTo3G3Di.js";var r={title:`Privacy Policy`,last_updated:`October 2026`,intro:`This Privacy Policy explains how Entertainment Trends (“we”, “us”, or “our”) collects, uses, and protects information when you visit the Site.`,content:`<section>
  <h2>1. Information We Collect</h2>
  <p>We collect two categories of information: (a) information you voluntarily provide, and (b) information automatically collected as you browse the Site.</p>
  <ul>
    <li><strong>Voluntary information:</strong> name, email address or message body when you submit a contact form or email us.</li>
    <li><strong>Automatic information:</strong> your IP address, browser type, device type, referring website, pages visited, and approximate country/region via standard web server logs.</li>
    <li><strong>Cookies & storage:</strong> small text files stored in your browser to remember preferences, anonymised analytics sessions, and ad serving settings.</li>
  </ul>
</section>

<section>
  <h2>2. How We Use Information</h2>
  <ul>
    <li>To operate, maintain and improve the Site and our editorial output.</li>
    <li>To respond to your enquiries, feedback or tips submitted via email or contact forms.</li>
    <li>To measure anonymous audience engagement with stories and pages.</li>
    <li>To personalise advertisements and content where permitted by applicable law.</li>
    <li>To detect, prevent and address security, spam or abuse issues.</li>
  </ul>
</section>

<section>
  <h2>3. Cookies & Similar Technologies</h2>
  <p>We use both first-party and third-party cookies and similar technologies (e.g. local storage, web beacons) to remember your preferences and analyze audience engagement. You can control or disable cookies through your browser settings.</p>
</section>

<section>
  <h2>4. Third-Party Services</h2>
  <p>Portions of the Site are served through trusted third-party providers including hosting companies, analytics providers, CDNs, and ad networks. These providers may process your information under their own privacy policies.</p>
</section>

<section>
  <h2>5. Your Rights</h2>
  <p>Depending on where you live, you may have rights to request access to, correction of, or deletion of your personal information, or object to certain processing.</p>
</section>

<section>
  <h2>6. Data Retention</h2>
  <p>Contact correspondence is retained for a maximum of 24 months after the last communication unless longer retention is required by law. Anonymised analytics data is kept in aggregate form.</p>
</section>

<section>
  <h2>7. Contact</h2>
  <p>If you have any questions, concerns, or requests regarding this policy or how your data is handled, write to us via our Contact page or email privacy@entertainmenttrends.com.</p>
</section>`};async function i(){try{let n=await t(e(`/settings/privacy`));if(n.ok&&n.data&&n.data.content)return{title:n.data.title||r.title,last_updated:n.data.last_updated||r.last_updated,intro:n.data.intro??r.intro,content:n.data.content,updated_at:n.data.updated_at}}catch{}try{let e=localStorage.getItem(`et_privacy_policy`);if(e){let t=JSON.parse(e);if(t?.content)return t}}catch{}return r}async function a(){try{let t=await n(e(`/admin/privacy`),{method:`GET`});if(t.ok){let e=await t.json();if(e&&e.content)return e}}catch{}try{let t=await n(e(`/admin/settings`),{method:`GET`});if(t.ok){let e=(await t.json())?.site_meta?.privacy_policy;if(e&&e.content)return e}}catch{}try{let e=localStorage.getItem(`et_privacy_policy`);if(e){let t=JSON.parse(e);if(t?.content)return t}}catch{}return r}async function o(t){let i={title:(t.title||r.title).trim(),last_updated:(t.last_updated||r.last_updated).trim(),intro:(t.intro??r.intro??``).trim(),content:(t.content||r.content).trim(),updated_at:new Date().toISOString()};try{localStorage.setItem(`et_privacy_policy`,JSON.stringify(i))}catch{}try{(await n(e(`/admin/privacy`),{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(i)})).ok}catch{}try{let t=await n(e(`/admin/settings`),{method:`GET`}),r={};t.ok&&(r=(await t.json())?.site_meta||{}),r.privacy_policy=i,(await n(e(`/admin/settings`),{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({site_meta:r})})).ok}catch{}return{ok:!0,privacy:i}}export{o as i,a as n,i as r,r as t};