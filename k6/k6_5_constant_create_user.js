import http from "k6/http";
import { check, sleep } from "k6";
// import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { htmlReport } from "./bundle.js";

// Test configuration
export const options = {
  discardResponseBodies: true, // ไม่เก็บ response body เพื่อประหยัดหน่วยความจำและประมวลผลได้เร็วขึ้น
  scenarios: {
    constant: {
      executor: 'constant-arrival-rate', // ใช้ executor แบบ constant-arrival-rate: ยิง request ด้วยความเร็วคงที่
      duration: '30s', // ระยะเวลาทดสอบ: 1 นาที
      rate: 10000, // อัตราการยิง request: 84 requests/วินาที อาจจะต้องหา Magic Number สำหรับทดสอบ
      timeUnit: '1s', // หน่วยเวลาของ rate: ต่อ 1 วินาที
      preAllocatedVUs: 10000, // สร้าง Virtual Users (VU) ล่วงหน้า
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: 'rate<0.01', abortOnFail: true }], // หยุดทันทีเมื่อ fail (ประหยัดเวลา/ทรัพยากร) ใส่ abortOnFail
    http_req_duration: [
      { threshold: 'p(95)<500', abortOnFail: false },
      'p(99)<1200'
    ],
    checks: ['rate>0.99'],
  },
};

const headers = {
  headers: {
    "Content-Type": "application/json"
  },
};

// Simulated user behavior
export default function () {
  // POST
  let body = {
    "username":"optest",
    "email":"opsnoopop@hotmail.com"
  };
  let res = http.post("http://container_go:3000/users", JSON.stringify(body), headers);

  // Validate response status
  check(res, { "status was 201": (r) => r.status == 201 });

  sleep(1);
}

export function handleSummary(data) {
  const now = new Date();
  
  // Convert to UTC+07:00 timezone (add 7 hours to UTC)
  const utcPlus7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));

  const year = utcPlus7.getUTCFullYear();
  const month = (utcPlus7.getUTCMonth() + 1 < 10) ? "0" + (utcPlus7.getUTCMonth() + 1) : utcPlus7.getUTCMonth() + 1; // Month is 0-indexed (0 for January, 11 for December)
  const day = (utcPlus7.getUTCDate() < 10) ? "0" + utcPlus7.getUTCDate() : utcPlus7.getUTCDate();
  const hours = (utcPlus7.getUTCHours() < 10) ? "0" + utcPlus7.getUTCHours() : utcPlus7.getUTCHours();
  const minutes = (utcPlus7.getUTCMinutes() < 10) ? "0" + utcPlus7.getUTCMinutes() : utcPlus7.getUTCMinutes();
  const seconds = (utcPlus7.getUTCSeconds() < 10) ? "0" + utcPlus7.getUTCSeconds() : utcPlus7.getUTCSeconds();

  const filename = "/k6/5_constant_create_user_" + year +  month + day + "_" + hours + minutes + seconds + ".html";
  
  return {
    [filename]: htmlReport(data, {
      title: "5_constant_create_user_api_go_postgresql_" + year + month + day + "_" + hours + minutes + seconds
    }),
  };
}