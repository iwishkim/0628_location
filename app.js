let watchId = null;
let logs = JSON.parse(localStorage.getItem("locationLogs") || "[]");

const statusBadge = document.getElementById("statusBadge");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const recordBtn = document.getElementById("recordBtn");
const clearBtn = document.getElementById("clearBtn");
const currentLocation = document.getElementById("currentLocation");
const timeline = document.getElementById("timeline");
const memoInput = document.getElementById("memoInput");
const countText = document.getElementById("countText");
const lastTimeText = document.getElementById("lastTimeText");

startBtn.addEventListener("click", startTracking);
stopBtn.addEventListener("click", stopTracking);
recordBtn.addEventListener("click", recordNow);
clearBtn.addEventListener("click", clearLogs);

function setStatus(text, className) {
  statusBadge.textContent = text;
  statusBadge.className = `badge ${className}`;
}

function formatTime(date) {
  return date.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function checkGeoSupport() {
  if (!navigator.geolocation) {
    alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
    return false;
  }
  return true;
}

function startTracking() {
  if (!checkGeoSupport()) return;

  setStatus("권한 요청 중", "waiting");

  watchId = navigator.geolocation.watchPosition(
    position => {
      saveLocation(position, "자동 기록");
      setStatus("기록 중", "active");
    },
    error => {
      handleLocationError(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  setStatus("정지됨", "stopped");
}

function recordNow() {
  if (!checkGeoSupport()) return;

  setStatus("현재 위치 확인 중", "waiting");

  navigator.geolocation.getCurrentPosition(
    position => {
      saveLocation(position, "수동 기록");
      setStatus("기록 완료", "active");
    },
    error => {
      handleLocationError(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );
}

function saveLocation(position, type) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const accuracy = Math.round(position.coords.accuracy);
  const memo = memoInput.value.trim();
  const time = formatTime(new Date());

  const log = {
    time,
    lat,
    lng,
    accuracy,
    memo,
    type
  };

  logs.unshift(log);
  localStorage.setItem("locationLogs", JSON.stringify(logs));

  currentLocation.innerHTML = `
    <strong>${time}</strong><br>
    위도: ${lat.toFixed(6)}<br>
    경도: ${lng.toFixed(6)}<br>
    정확도: 약 ${accuracy}m<br>
    기록 방식: ${type}
  `;

  memoInput.value = "";
  renderLogs();
}

function renderLogs() {
  countText.textContent = `${logs.length}개`;
  lastTimeText.textContent = logs.length ? logs[0].time : "없음";

  if (logs.length === 0) {
    timeline.innerHTML = `<div class="empty">아직 이동 기록이 없습니다.</div>`;
    return;
  }

  timeline.innerHTML = logs.map(log => `
    <div class="log-item">
      <div class="log-time">${log.time}</div>
      <div class="log-meta">
        ${log.type}<br>
        위도 ${Number(log.lat).toFixed(6)}, 경도 ${Number(log.lng).toFixed(6)}<br>
        정확도 약 ${log.accuracy}m
      </div>

      ${log.memo ? `<div class="log-memo">${escapeHtml(log.memo)}</div>` : ""}

      <div class="map-links">
        <a href="https://map.kakao.com/link/map/${log.lat},${log.lng}" target="_blank">
          카카오맵
        </a>
        <a href="https://www.google.com/maps?q=${log.lat},${log.lng}" target="_blank">
          구글맵
        </a>
      </div>
    </div>
  `).join("");
}

function clearLogs() {
  if (!confirm("오늘의 위치 기록을 모두 삭제할까요?")) return;

  logs = [];
  localStorage.removeItem("locationLogs");
  currentLocation.textContent = "아직 위치 기록이 없습니다.";
  setStatus("대기 중", "waiting");
  renderLogs();
}

function handleLocationError(error) {
  setStatus("오류 발생", "stopped");

  if (error.code === 1) {
    alert("위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용하세요.");
  } else if (error.code === 2) {
    alert("현재 위치를 찾을 수 없습니다. GPS를 켜고 다시 시도하세요.");
  } else if (error.code === 3) {
    alert("위치 요청 시간이 초과되었습니다. 다시 시도하세요.");
  } else {
    alert("위치 오류가 발생했습니다.");
  }
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

renderLogs();
