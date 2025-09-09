import http from "k6/http";
import { check, sleep } from "k6";
// import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { htmlReport } from "./bundle.js";

// Test configuration
export const options = {
  discardResponseBodies: true, // ไม่เก็บ response body เพื่อประหยัดหน่วยความจำและประมวลผลได้เร็วขึ้น
  scenarios: {
    ramping: {
      executor: 'ramping-arrival-rate', // ใช้ executor แบบ ramping-arrival-rate: ยิง request ด้วยความเร็วที่เพิ่มขึ้นอย่างต่อเนื่อง
      timeUnit: '1s', // หน่วยเวลาของ rate: ต่อ 1 วินาที
      startRate: 1000, // เริ่มต้นด้วย 1000 คนที่ทำงานพร้อมกัน
      preAllocatedVUs: 5000, // สร้าง Virtual Users (VU) ล่วงหน้า 5000 ตัว
      maxVUs: 10000, // สร้าง Virtual Users (VU) สูงสุด 10000 ตัว
      stages: [
        { duration: '5s', target: 2000 },
        { duration: '5s', target: 4000 },
        { duration: '5s', target: 6000 },
        { duration: '5s', target: 8000 },
        { duration: '5s', target: 10000 },
        { duration: '5s', target: 0 },    // ramp-down
      ],
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
  // GET users/:id
  let res = http.get("http://container_go:3000/users/1");

  // Validate response status
  check(res, { "status was 200": (r) => r.status == 200 });

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

  const filename = "/k6/3_ramping_get_user_by_id_" + year +  month + day + "_" + hours + minutes + seconds + ".html";
  
  return {
    [filename]: htmlReport(data, {
      title: "3_ramping_get_user_by_id_api_go_postgresql_" + year + month + day + "_" + hours + minutes + seconds
    }),
  };
}