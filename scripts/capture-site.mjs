import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import http from "node:http";
import { chromium, devices } from "playwright";

const rootDir = process.cwd();
const baseUrl = "http://127.0.0.1:4173";
const outDir = path.join(rootDir, "output", "screenshots");

const routes = [
  ["home", "/"],
  ["donaciones", "/#donaciones"],
  ["privacidad", "/privacidad"],
  ["terminos", "/terminos"],
  ["aviso-legal", "/aviso-legal"],
  ["soporte", "/soporte"],
  ["alta-comercio", "/alta-comercio"],
  ["solicitud-eliminacion", "/solicitud-eliminacion"],
  ["login", "/login"],
  ["mi-cuenta", "/mi-cuenta"],
  ["admin-login", "/admin/login"]
];

const adminCredentials = {
  email: "lucasmouhsen@gmail.com",
  password: "Lucas2021"
};

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
          return;
        }
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Server not ready after ${timeoutMs}ms`));
          return;
        }
        setTimeout(tick, 500);
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Server not reachable after ${timeoutMs}ms`));
          return;
        }
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

async function captureRoute(page, name, route, suffix = "desktop") {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  if (route.includes("#")) {
    const hash = route.split("#")[1];
    if (hash) {
      await page.locator(`#${hash}`).first().scrollIntoViewIfNeeded().catch(() => {});
    }
  }
  await page.waitForTimeout(400);
  const file = path.join(outDir, `${name}-${suffix}.png`);
  await page.screenshot({ path: file, fullPage: true });
}

async function loginAdmin(page) {
  await page.goto(`${baseUrl}/admin/login`, { waitUntil: "networkidle" });
  await page.fill("#admin-login-email", adminCredentials.email);
  await page.fill("#admin-login-password", adminCredentials.password);
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForURL((url) => url.pathname.includes("/admin/reportes"), { timeout: 15000 }).catch(() => null)
  ]);
  await page.waitForTimeout(1200);
}

async function run() {
  await fs.mkdir(outDir, { recursive: true });

  const preview = spawn("npm", ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173"], {
    cwd: rootDir,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"]
  });

  preview.stdout.on("data", () => {});
  preview.stderr.on("data", () => {});

  try {
    await waitForServer(baseUrl);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1512, height: 982 } });
    const page = await context.newPage();

    for (const [name, route] of routes) {
      await captureRoute(page, name, route);
    }

    await loginAdmin(page);
    await captureRoute(page, "admin-reportes", "/admin/reportes");
    await captureRoute(page, "admin-comercios", "/admin/comercios");

    const mobileContext = await browser.newContext({ ...devices["iPhone 13"] });
    const mobilePage = await mobileContext.newPage();
    await captureRoute(mobilePage, "home", "/", "mobile");
    await captureRoute(mobilePage, "admin-comercios", "/admin/comercios", "mobile");

    await mobileContext.close();
    await context.close();
    await browser.close();

    console.log(`Screenshots saved to: ${outDir}`);
  } finally {
    preview.kill("SIGTERM");
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
