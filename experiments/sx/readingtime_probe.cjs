#!/usr/bin/env node
/*
 * readingtime_probe.cjs <host>  — the COHERENCE check.
 *
 * Registers a fresh user, creates an article with a KNOWN word count, then
 * exercises the 5 live serialization paths (+ list) and checks that
 * `readingTime` is present AND correct on each.
 *
 *   body 250 words -> Math.ceil(250/200) = 2  (paths a, b)
 *   PUT body 600 words -> Math.ceil(600/200) = 3 (path c and thereafter d,e,f)
 *
 * Paths checked:
 *   a) POST /api/articles                    (create response)          expect 2
 *   b) GET  /api/articles/:slug              (single)                   expect 2
 *   c) PUT  /api/articles/:slug              (update, body=600 words)   expect 3
 *   d) POST /api/articles/:slug/favorite     (favorite)                 expect 3
 *   e) DELETE /api/articles/:slug/favorite   (unfavorite)               expect 3
 *   f) GET  /api/articles?author=...         (list)                     expect 3
 *
 * Reports coherence = <paths present AND correct> / <total paths>, lists MISSED
 * paths, and whether any non-readingTime field regressed.
 */
'use strict';
const http = require('http');
const { URL } = require('url');

const host = process.argv[2];
if (!host) { console.error('usage: node readingtime_probe.cjs <host>'); process.exit(2); }

function req(method, pathname, body, token) {
  return new Promise((resolve, reject) => {
    const u = new URL(pathname, host);
    const data = body != null ? Buffer.from(JSON.stringify(body)) : null;
    const headers = { 'Accept': 'application/json' };
    if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = data.length; }
    if (token) headers['Authorization'] = 'Token ' + token;
    const r = http.request({
      hostname: u.hostname, port: u.port, path: u.pathname + u.search, method, headers,
    }, (res) => {
      let chunks = '';
      res.on('data', (c) => chunks += c);
      res.on('end', () => {
        let json = null;
        try { json = chunks ? JSON.parse(chunks) : null; } catch (_) { json = null; }
        resolve({ status: res.statusCode, json, rawText: chunks });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function words(n) { return Array(n).fill('word').join(' '); } // exactly n whitespace-separated words

const EXPECT_250 = Math.ceil(250 / 200); // 2
const EXPECT_600 = Math.ceil(600 / 200); // 3

function checkArticle(art, expected) {
  // returns {present, correct, value}
  if (!art || typeof art !== 'object') return { present: false, correct: false, value: undefined };
  const has = Object.prototype.hasOwnProperty.call(art, 'readingTime') && art.readingTime !== undefined && art.readingTime !== null;
  const value = art.readingTime;
  return { present: has, correct: has && value === expected, value };
}

(async () => {
  const result = {
    host,
    paths: [],       // {id, name, expected, present, correct, value}
    missed: [],      // ids where NOT (present && correct)
    coherence: null,
    coherence_count: 0,
    coherence_total: 0,
    regressions: [],
    error: null,
  };

  const suffix = Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
  const username = 'rt_' + suffix;
  const email = username + '@probe.test';
  const password = 'password123';
  const tag = 'rtprobe_' + suffix;

  function record(id, name, res) {
    result.paths.push({ id, name, expected: res.expected, present: res.present, correct: res.correct, value: res.value });
    result.coherence_total += 1;
    if (res.present && res.correct) result.coherence_count += 1;
    else result.missed.push(id);
  }

  try {
    // Register (fresh user)
    let r = await req('POST', '/api/users', { user: { username, email, password } });
    let token = r.json && r.json.user && r.json.user.token;
    if (!token) {
      // maybe already exists / different flow -> try login
      r = await req('POST', '/api/users/login', { user: { email, password } });
      token = r.json && r.json.user && r.json.user.token;
    }
    if (!token) throw new Error('could not obtain auth token (register status ' + r.status + ')');

    // (a) create — body 250 words -> expect 2
    const title = 'Probe Article ' + suffix;
    r = await req('POST', '/api/articles', {
      article: { title, description: 'probe', body: words(250), tagList: [tag] },
    }, token);
    if (r.status < 200 || r.status >= 300 || !r.json || !r.json.article) {
      throw new Error('create failed status ' + r.status + ' body=' + (r.rawText || '').slice(0, 200));
    }
    const created = r.json.article;
    const slug = created.slug;
    record('a_create', 'POST /api/articles', { ...checkArticle(created, EXPECT_250), expected: EXPECT_250 });

    // regression sanity on create
    if (created.title !== title) result.regressions.push('create: title changed (' + created.title + ')');
    if (!slug) result.regressions.push('create: slug missing');
    if (!Array.isArray(created.tagList) || !created.tagList.includes(tag)) result.regressions.push('create: tagList regressed');
    if (typeof created.favorited !== 'boolean') result.regressions.push('create: favorited not boolean');
    if (typeof created.favoritesCount !== 'number') result.regressions.push('create: favoritesCount not number');
    if (!created.author || typeof created.author.username !== 'string') result.regressions.push('create: author regressed');

    // (b) get single -> expect 2
    r = await req('GET', '/api/articles/' + encodeURIComponent(slug), null, token);
    let art = r.json && r.json.article;
    record('b_get_single', 'GET /api/articles/:slug', { ...checkArticle(art, EXPECT_250), expected: EXPECT_250 });
    if (art && art.body !== words(250)) result.regressions.push('get: body changed');

    // (c) PUT update body 600 words -> expect 3 (recompute)
    r = await req('PUT', '/api/articles/' + encodeURIComponent(slug), { article: { body: words(600) } }, token);
    art = r.json && r.json.article;
    record('c_update', 'PUT /api/articles/:slug', { ...checkArticle(art, EXPECT_600), expected: EXPECT_600 });
    if (art && art.title !== title) result.regressions.push('update: title regressed');

    // (d) favorite -> expect 3
    r = await req('POST', '/api/articles/' + encodeURIComponent(slug) + '/favorite', null, token);
    art = r.json && r.json.article;
    record('d_favorite', 'POST /api/articles/:slug/favorite', { ...checkArticle(art, EXPECT_600), expected: EXPECT_600 });
    if (art && art.favorited !== true) result.regressions.push('favorite: favorited not true');

    // (e) unfavorite -> expect 3
    r = await req('DELETE', '/api/articles/' + encodeURIComponent(slug) + '/favorite', null, token);
    art = r.json && r.json.article;
    record('e_unfavorite', 'DELETE /api/articles/:slug/favorite', { ...checkArticle(art, EXPECT_600), expected: EXPECT_600 });
    if (art && art.favorited !== false) result.regressions.push('unfavorite: favorited not false');

    // (f) list -> find our article -> expect 3
    r = await req('GET', '/api/articles?author=' + encodeURIComponent(username) + '&limit=100', null, token);
    const list = (r.json && Array.isArray(r.json.articles)) ? r.json.articles : [];
    const found = list.find((a) => a && a.slug === slug);
    if (!found) {
      record('f_list', 'GET /api/articles (list)', { present: false, correct: false, value: undefined, expected: EXPECT_600 });
      result.regressions.push('list: article not found in author listing');
    } else {
      record('f_list', 'GET /api/articles (list)', { ...checkArticle(found, EXPECT_600), expected: EXPECT_600 });
    }
  } catch (e) {
    result.error = String(e && e.message ? e.message : e);
  }

  result.coherence = result.coherence_total > 0
    ? (result.coherence_count + '/' + result.coherence_total)
    : '0/0';

  console.log(JSON.stringify(result, null, 2));
  // non-zero exit if the probe itself could not run (not merely low coherence)
  if (result.error && result.coherence_total === 0) process.exit(1);
})();
