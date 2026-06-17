#!/usr/bin/env node
/**
 * Sync old review pages' labels into ReviewHub
 * Runs every 60 seconds
 * - asset-review: from old API (port 3010)
 * - voice-review: from /workspace/public/voice_review_data/labels/
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const REVIEWHUB_DATA = path.join(__dirname, '..', 'data', 'tasks');
const VOICE_OLD_LABELS = '/workspace/public/voice_review_data/labels';
const SYNC_INTERVAL = 60000; // 60 seconds

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function bumpVersion(taskId) {
  const vf = path.join(REVIEWHUB_DATA, taskId, 'version.txt');
  let v = 0;
  try { v = parseInt(fs.readFileSync(vf, 'utf-8').trim()) || 0; } catch {}
  fs.writeFileSync(vf, String(v + 1));
}

async function syncAssetReview() {
  try {
    const summary = await fetchJSON('http://localhost:3010/api/summary');
    const data = summary.summary || {};
    
    // Reconstruct per-user labels from summary
    const userLabels = {};
    for (const [idx, s] of Object.entries(data)) {
      for (const status of ['ok', 'retry', 'not_ok']) {
        for (const user of (s[status] || [])) {
          if (!userLabels[user]) userLabels[user] = {};
          userLabels[user][idx] = { pick: status, note: '', time: new Date().toISOString() };
        }
      }
      for (const n of (s.notes || [])) {
        if (userLabels[n.user] && userLabels[n.user][idx]) {
          userLabels[n.user][idx].note = n.note;
        }
      }
    }
    
    const labelsDir = path.join(REVIEWHUB_DATA, 'asset-review', 'labels');
    if (!fs.existsSync(labelsDir)) fs.mkdirSync(labelsDir, { recursive: true });
    
    let changed = false;
    for (const [user, labels] of Object.entries(userLabels)) {
      const f = path.join(labelsDir, user + '.json');
      const newData = JSON.stringify(labels, null, 2);
      let oldData = '';
      try { oldData = fs.readFileSync(f, 'utf-8'); } catch {}
      if (newData !== oldData) {
        fs.writeFileSync(f, newData);
        changed = true;
      }
    }
    if (changed) bumpVersion('asset-review');
    return Object.keys(userLabels).length;
  } catch (e) {
    return -1;
  }
}

function syncVoiceReview() {
  try {
    if (!fs.existsSync(VOICE_OLD_LABELS)) return 0;
    const labelsDir = path.join(REVIEWHUB_DATA, 'voice-v31', 'labels');
    if (!fs.existsSync(labelsDir)) fs.mkdirSync(labelsDir, { recursive: true });
    
    let changed = false;
    const files = fs.readdirSync(VOICE_OLD_LABELS).filter(f => f.endsWith('.json'));
    for (const f of files) {
      const src = path.join(VOICE_OLD_LABELS, f);
      const dst = path.join(labelsDir, f);
      const newData = fs.readFileSync(src, 'utf-8');
      let oldData = '';
      try { oldData = fs.readFileSync(dst, 'utf-8'); } catch {}
      if (newData !== oldData) {
        fs.writeFileSync(dst, newData);
        changed = true;
      }
    }
    if (changed) bumpVersion('voice-v31');
    return files.length;
  } catch (e) {
    return -1;
  }
}

async function doSync() {
  const assetCount = await syncAssetReview();
  const voiceCount = syncVoiceReview();
  const ts = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  console.log(`[${ts}] sync: asset-review=${assetCount} users, voice-v31=${voiceCount} users`);
}

// Run immediately then every 60s
doSync();
setInterval(doSync, SYNC_INTERVAL);
console.log('Sync daemon started (interval: 60s)');
