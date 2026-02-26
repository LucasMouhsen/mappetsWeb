import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs/promises";
import http from "node:http";
import { chromium } from "playwright";

const baseUrl = "http://127.0.0.1:4173";
const root = process.cwd();
const out = path.join(root, "output", "screenshots", "check");

const creds = { email: "lucasmouhsen@gmail.com", password: "Lucas2021" };

function waitServer(url, timeout = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const ping = () => {
      http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) return resolve();
        if (Date.now() - start > timeout) return reject(new Error("timeout"));
        setTimeout(ping, 400);
      }).on("error", () => {
        if (Date.now() - start > timeout) return reject(new Error("timeout"));
        setTimeout(ping, 400);
      });
    };
    ping();
  });
}

const preview = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173"], { cwd: root, shell: true, stdio: "ignore" });

try {
  await fs.mkdir(out, { recursive: true });
  await waitServer(baseUrl);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 768 } });

  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.fill("#admin-login-email", creds.email);
  await page.fill("#admin-login-password", creds.password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForURL((u) => u.pathname.includes("/admin/reportes"), { timeout: 15000 }).catch(() => null)
  ]);

  await page.goto(`${baseUrl}/admin/comercios`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, "admin-comercios-header.png"), fullPage: false });

  const hours = page.locator(".admin-hours-row").first();
  await hours.scrollIntoViewIfNeeded();
  await hours.screenshot({ path: path.join(out, "admin-hours-row.png") });

  const table = page.locator(".admin-table-wrap").first();
  await table.scrollIntoViewIfNeeded();
  await table.screenshot({ path: path.join(out, "admin-table.png") });

  await browser.close();
  console.log(`Saved to ${out}`);
} finally {
  preview.kill("SIGTERM");
}
