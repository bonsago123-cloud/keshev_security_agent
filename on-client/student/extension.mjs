// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('div');
      const addText = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.append(node);
        return node;
      };
      const displayValue = (value) => typeof value === 'string' && value.length > 0 ? value : '확인 불가';
      const deviceStatusLabel = (status) => ({
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      })[status] || '확인 불가';
      const sessionStatusLabel = (status) => ({
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      })[status] || '확인 불가';
      const modeLabel = (mode) => ({
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      })[mode] || '확인 불가';
      const appendMode = (label, resource) => {
        addText(root, 'p', `${label} 연결 상태: ${modeLabel(resource && resource.mode)}`);
      };
      const appendError = (label, resource) => {
        const code = resource && resource.error && resource.error.code;
        const message = resource && resource.error && typeof resource.error.message === 'string'
          ? resource.error.message
          : '서버가 오류 메시지를 제공하지 않았습니다.';
        const prefix = code === 'CONTRACT_MISMATCH' || code === 'ENGINE_RESULT_UNVERIFIED'
          ? '확인 불가'
          : '연결 실패';
        addText(root, 'p', `${label}: ${prefix}: ${message}`);
      };

      addText(root, 'h3', '로그인 사용자·현재 기기·현재 세션');
      appendMode('로그인 정보', me);
      appendMode('기기', devices);
      appendMode('세션', sessions);

      if (!me || me.status === 'loading') {
        addText(root, 'p', '로그인 정보: 불러오는 중');
      } else if (me.status === 'error') {
        appendError('로그인 정보', me);
      } else if (me.status === 'ok' && me.data && me.data.user && me.data.device && me.data.session) {
        addText(root, 'p', `사용자: ${displayValue(me.data.user.label)} (ID: ${displayValue(me.data.user.id)})`);
        addText(root, 'p', `현재 기기: ${displayValue(me.data.device.label)} (ID: ${displayValue(me.data.device.id)}) · ${deviceStatusLabel(me.data.device.status)}`);
        addText(root, 'p', `현재 세션: ${displayValue(me.data.session.id)} · ${sessionStatusLabel(me.data.session.status)}`);
      } else {
        addText(root, 'p', '로그인 정보: 확인 불가');
      }

      addText(root, 'h4', '기기');
      if (!devices || devices.status === 'loading') {
        addText(root, 'p', '기기: 불러오는 중');
      } else if (devices.status === 'error') {
        appendError('기기', devices);
      } else if (devices.status === 'ok' && Array.isArray(devices.data)) {
        if (devices.data.length === 0) {
          addText(root, 'p', '기기 목록이 비어 있습니다.');
        } else {
          const list = document.createElement('ul');
          for (const device of devices.data) {
            addText(list, 'li', `${displayValue(device.label)} (ID: ${displayValue(device.id)}) · ${deviceStatusLabel(device.status)}`);
          }
          root.append(list);
        }
      } else {
        addText(root, 'p', '기기: 확인 불가');
      }

      addText(root, 'h4', '세션');
      if (!sessions || sessions.status === 'loading') {
        addText(root, 'p', '세션: 불러오는 중');
      } else if (sessions.status === 'error') {
        appendError('세션', sessions);
      } else if (sessions.status === 'ok' && Array.isArray(sessions.data)) {
        if (sessions.data.length === 0) {
          addText(root, 'p', '세션 목록이 비어 있습니다.');
        } else {
          const list = document.createElement('ul');
          for (const session of sessions.data) {
            addText(list, 'li', `${displayValue(session.id)} · ${sessionStatusLabel(session.status)}`);
          }
          root.append(list);
        }
      } else {
        addText(root, 'p', '세션: 확인 불가');
      }

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('div');
      const addLine = (message) => {
        const line = document.createElement('p');
        line.textContent = message;
        root.appendChild(line);
      };
      const displayValue = (value) =>
        typeof value === 'string' && value.trim() !== '' ? value : '확인 불가';
      const modeLabels = {
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      addLine(`연결 상태: ${modeLabels[mode] || '확인 불가'}`);

      if (status === 'idle') {
        addLine('앱을 골라 접속을 요청하세요.');
        return root;
      }
      if (status === 'loading') {
        addLine('접근 판정 확인 중');
        return root;
      }
      if (status === 'error') {
        addLine(`요청 실패: ${displayValue(error?.message)}`);
        addLine('이는 접근 거부(deny) 판정이 아니라 요청 결과를 확인하지 못한 상태입니다.');
        return root;
      }
      if (status !== 'ok') {
        addLine('접근 판정 확인 불가(unknown): 요청 상태를 확인할 수 없습니다.');
        return root;
      }

      const effectiveAppId = typeof data?.appId === 'string' && data.appId.trim()
        ? data.appId : appId;
      const decisionLabels = {
        allow: '접근 허용',
        deny: '접근 거부',
        challenge: '추가 확인 필요',
        unknown: '판정 확인 불가',
      };
      const decision = typeof data?.decision === 'string' &&
        Object.hasOwn(decisionLabels, data.decision) ? data.decision : 'unknown';
      addLine(`업무 앱 ID: ${displayValue(effectiveAppId)}`);
      addLine(`접근 판정: ${decisionLabels[decision]}(${decision})`);
      addLine(`판정 이유: ${displayValue(data?.reason)}`);
      addLine(`판정 시각: ${displayValue(data?.checkedAt)}`);

      if (decision === 'allow') {
        addLine('정책상 접근 허용이며 실제 업무 앱 접속 성공을 보장하지 않습니다.');
      } else if (decision === 'challenge') {
        addLine('추가 인증 또는 확인이 필요합니다. 이 앱이 확인 절차를 대신하지 않습니다.');
      } else if (decision === 'unknown') {
        addLine('접근이 허용된 것으로 확인되지 않았습니다.');
      }
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('div');
      const addText = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.appendChild(node);
        return node;
      };
      const show = (value, fallback = '확인 불가') =>
        typeof value === 'string' && value.trim() ? value : fallback;
      const labelFrom = (labels, value) => {
        const code = typeof value === 'string' && Object.hasOwn(labels, value)
          ? value : 'unknown';
        return `${labels[code]}(${code})`;
      };
      const kindLabels = { access: '접속 기록', xdr: 'XDR 경보', unknown: '확인 불가' };
      const accessLabels = { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const deviceLabels = {
        compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가',
      };
      const modeLabels = {
        connected: '연결됨', demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가',
      };

      addText(root, 'h3', '내 접속 기록·XDR 경보');
      addText(root, 'p', `연결 상태: ${modeLabels[mode] || '확인 불가'}`);
      if (status === 'loading') {
        addText(root, 'p', '보안 기록을 불러오는 중입니다.');
        return root;
      }
      if (status === 'error') {
        const invalidContract = error?.code === 'CONTRACT_MISMATCH' ||
          error?.code === 'ENGINE_RESULT_UNVERIFIED';
        const message = show(error?.message, '오류 메시지가 제공되지 않았습니다.');
        addText(root, 'p', invalidContract
          ? `기록을 불러오지 못했습니다. 확인 불가: ${message}`
          : `기록을 불러오지 못했습니다: ${message}`);
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        addText(root, 'p', '보안 기록을 확인할 수 없습니다.');
        return root;
      }
      if (data.length === 0) {
        addText(root, 'p', '표시할 기록이 없습니다.');
        return root;
      }

      // 서버가 준 배열은 변경하지 않고, 복사본만 정렬한다.
      const records = [...data].sort((left, right) => {
        const a = Date.parse(left?.at);
        const b = Date.parse(right?.at);
        return (Number.isFinite(b) ? b : 0) - (Number.isFinite(a) ? a : 0);
      });
      const filters = document.createElement('div');
      const list = document.createElement('ul');
      const details = document.createElement('div');
      const count = addText(root, 'p', '');
      root.appendChild(filters);
      root.appendChild(list);
      root.appendChild(details);

      const makeSelect = (name, choices, getLabel) => {
        const label = document.createElement('label');
        label.textContent = `${name}: `;
        const select = document.createElement('select');
        select.setAttribute('aria-label', name);
        const addOption = (value, text) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = text;
          select.appendChild(option);
        };
        addOption('all', '전체');
        for (const value of choices) addOption(value, getLabel(value));
        select.value = 'all';
        label.appendChild(select);
        filters.appendChild(label);
        return select;
      };
      const kinds = [...new Set(records.map((event) => event.kind))];
      const apps = [...new Set(records.map((event) => event.appId ?? ''))];
      const accesses = [...new Set(records.map((event) => event.state?.access ?? 'unknown'))];
      const kindFilter = makeSelect('기록 종류', kinds,
        (value) => labelFrom(kindLabels, value));
      const appFilter = makeSelect('업무 앱', apps,
        (value) => value === '' ? '앱 확인 불가' : value);
      const accessFilter = makeSelect('접속 상태', accesses,
        (value) => labelFrom(accessLabels, value));

      const makeDetail = (event) => {
        const section = document.createElement('section');
        section.setAttribute('data-student-event-detail', event.id);
        addText(section, 'h4', `기록 ${show(event.id)} 상세`);
        addText(section, 'p', `사건 ID: ${show(event.id)}`);
        addText(section, 'p', `업무 앱: ${show(event.appId, '앱 확인 불가')}`);
        addText(section, 'p', `접속 상태: ${labelFrom(accessLabels, event.state?.access)}`);
        addText(section, 'p', `세션 상태: ${labelFrom(sessionLabels, event.state?.session)}`);
        addText(section, 'p', `기기 상태: ${labelFrom(deviceLabels, event.state?.device)}`);
        for (const [title, entries] of [['근거', event.evidence], ['규칙', event.rules]]) {
          addText(section, 'h5', title);
          if (!Array.isArray(entries) || entries.length === 0) {
            addText(section, 'p', `${title} 항목이 없습니다.`);
            continue;
          }
          const items = document.createElement('ul');
          for (const entry of entries) {
            addText(items, 'li', `ID: ${show(entry.id)} · 내용: ${show(entry.text)}`);
          }
          section.appendChild(items);
        }
        // 16단계: 연결되지 않은 조치는 실제 실행 버튼 대신 비활성 안내만 표시한다.
        if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
          addText(section, 'p', '조치 실행 연결은 준비 중입니다. 이 화면에서는 조치를 요청하거나 실행하지 않습니다.');
          for (const action of event.supportedActions) {
            if (typeof action !== 'string' || !action.trim()) continue;
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = `${action} 미지원`;
            button.disabled = true;
            section.appendChild(button);
          }
        }
        return section;
      };
      const renderRows = () => {
        const matching = records.filter((event) =>
          (kindFilter.value === 'all' || event.kind === kindFilter.value) &&
          (appFilter.value === 'all' || (event.appId ?? '') === appFilter.value) &&
          (accessFilter.value === 'all' || (event.state?.access ?? 'unknown') === accessFilter.value));
        count.textContent = `표시된 기록 ${matching.length}건 / 받은 기록 ${records.length}건`;
        list.replaceChildren();
        details.replaceChildren();
        if (matching.length === 0) {
          addText(list, 'li', '선택한 필터에 해당하는 기록이 없습니다.');
          return;
        }
        for (const event of matching) {
          const row = document.createElement('li');
          row.setAttribute('data-student-event-id', event.id);
          addText(row, 'p', `사건 ID: ${show(event.id)} · 시각: ${show(event.at)} · 종류: ${labelFrom(kindLabels, event.kind)} · 앱: ${show(event.appId, '앱 확인 불가')} · 요약: ${show(event.summary)}`);
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `${event.id} 상세`;
          button.addEventListener('click', () => {
            details.replaceChildren(makeDetail(event));
          });
          row.appendChild(button);
          list.appendChild(row);
        }
      };
      for (const select of [kindFilter, appFilter, accessFilter]) {
        select.addEventListener('change', renderRows);
      }
      renderRows();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('div');
      const addText = (parent, tag, text) => {
        const node = document.createElement(tag);
        node.textContent = text;
        parent.appendChild(node);
        return node;
      };
      const show = (value, fallback = '확인 불가') =>
        typeof value === 'string' && value.trim() ? value : fallback;
      const statusLabel = (labels, value) => {
        const code = typeof value === 'string' && Object.hasOwn(labels, value)
          ? value : 'unknown';
        return `${labels[code]}(${code})`;
      };
      const modeLabels = {
        connected: '연결됨', demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가',
      };
      const deviceLabels = {
        compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가',
      };
      const sessionLabels = {
        active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가',
      };
      const safeDiagnostic = (value) => {
        const text = show(value);
        return /Bearer\s+\S+|sk-(?:[A-Za-z0-9_-]{8,})|-----BEGIN/i.test(text) ? '확인 불가' : text;
      };
      const retryHelp = '다시 시도하려면 화면 위쪽의 「다시 불러오기」 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.';
      const hasTimedOut = (resource) => {
        const code = resource?.error?.code;
        const message = resource?.error?.message;
        return typeof code === 'string' && /TIMEOUT|TIMED_OUT/i.test(code) ||
          typeof message === 'string' && /시간\s*초과|time\s*out|timed\s*out/i.test(message);
      };
      const renderList = (title, resource, emptyMessage, formatRow) => {
        addText(root, 'h4', title);
        addText(root, 'p', `${title} 연결 상태: ${modeLabels[resource?.mode] || '확인 불가'}`);
        if (!resource || resource.status === 'loading') {
          addText(root, 'p', `${title}: 불러오는 중`);
        } else if (resource.status === 'error') {
          const unverified = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(resource.error?.code);
          const prefix = unverified ? '확인 불가 · ' : hasTimedOut(resource) ? '시간 초과로 ' : '';
          addText(root, 'p', `${title}: ${prefix}불러오지 못했습니다: ${show(resource.error?.message, '오류 메시지가 제공되지 않았습니다.')}`);
          addText(root, 'p', retryHelp);
        } else if (resource.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) {
            addText(root, 'p', emptyMessage);
          } else {
            const list = document.createElement('ul');
            for (const item of resource.data) addText(list, 'li', formatRow(item));
            root.appendChild(list);
          }
        } else {
          addText(root, 'p', `${title}: 확인 불가. 조회 결과 형식을 확인할 수 없습니다.`);
        }
      };

      addText(root, 'h3', '기기·세션·알림·도움정보');
      addText(root, 'p', `전체 연결 상태: ${modeLabels[mode] || '확인 불가'}`);
      renderList('등록 기기', devices, '등록된 기기가 없습니다.', (item) =>
        `기기: ${show(item?.label)} · ID: ${show(item?.id)} · 상태: ${statusLabel(deviceLabels, item?.status)}`);
      renderList('현재 세션', sessions, '현재 연결이 없습니다.', (item) =>
        `세션 ID: ${show(item?.id)} · 상태: ${statusLabel(sessionLabels, item?.status)}`);
      addText(root, 'p', '세션 조회는 현재 검증된 연결 1건만 대상으로 합니다. 과거 세션 전체 목록이 아닙니다.');

      addText(root, 'h4', '주의 알림');
      if (!Array.isArray(notifications)) {
        addText(root, 'p', '알림을 확인할 수 없습니다.');
      } else if (notifications.length === 0) {
        addText(root, 'p', '주의할 알림이 없습니다.');
      } else {
        const list = document.createElement('ul');
        for (const notice of notifications) {
          const code = notice?.code;
          const safeCode = typeof code === 'string' && /^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(code)
            ? code : '확인 불가';
          addText(list, 'li', `자료: ${show(notice?.resource)} · 코드: ${safeCode} · 내용: ${show(notice?.message)}`);
        }
        root.appendChild(list);
      }

      addText(root, 'h4', '진단 도움정보');
      const diagnosticReady = diagnostics?.status === 'ok' && diagnostics.data &&
        typeof diagnostics.data === 'object' && !Array.isArray(diagnostics.data);
      let safeLines = [];
      if (!diagnostics || diagnostics.status === 'idle') {
        addText(root, 'p', '진단 정보를 아직 불러오지 않았습니다. 제공 화면의 「도움정보 불러오기」 버튼을 누르세요.');
      } else if (diagnostics.status === 'loading') {
        addText(root, 'p', '진단 정보를 불러오는 중입니다.');
      } else if (diagnostics.status === 'error') {
        const unverified = ['CONTRACT_MISMATCH', 'ENGINE_RESULT_UNVERIFIED'].includes(diagnostics.error?.code);
        const prefix = unverified ? '확인 불가 · ' : hasTimedOut(diagnostics) ? '시간 초과로 ' : '';
        addText(root, 'p', `진단 정보를 ${prefix}불러오지 못했습니다: ${show(diagnostics.error?.message, '오류 메시지가 제공되지 않았습니다.')}`);
        addText(root, 'p', '사용자가 제공 화면의 「도움정보 불러오기」 버튼을 직접 눌러 다시 시도할 수 있습니다.');
      } else if (diagnosticReady) {
        const data = diagnostics.data;
        safeLines = [
          ['requestId', safeDiagnostic(data.requestId)],
          ['component', safeDiagnostic(data.component)],
          ['version', safeDiagnostic(data.version)],
          ['checkedAt', safeDiagnostic(data.checkedAt)],
          ['engine.mode', safeDiagnostic(data.engine?.mode)],
          ['engine.code', safeDiagnostic(data.engine?.code)],
        ];
        for (const [name, value] of safeLines) addText(root, 'p', `${name}: ${value}`);
      } else {
        addText(root, 'p', '진단 결과를 확인할 수 없습니다.');
      }

      addText(root, 'p', '도움정보 복사는 도움 요청에 필요한 위의 진단 항목만 복사합니다. 복사한 내용을 직접 확인하세요.');
      const copyButton = document.createElement('button');
      copyButton.type = 'button';
      copyButton.textContent = '도움정보 복사';
      copyButton.disabled = !diagnosticReady;
      root.appendChild(copyButton);
      const copyStatus = addText(root, 'p', '');
      copyButton.addEventListener('click', async () => {
        if (!diagnosticReady) return;
        const safeText = safeLines.map(([name, value]) => `${name}: ${value}`).join('\n');
        try {
          if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
            throw new Error('Clipboard API unavailable');
          }
          await navigator.clipboard.writeText(safeText);
          copyStatus.textContent = '도움 요청용 진단 정보를 복사했습니다. 내용을 확인한 뒤 사용하세요.';
        } catch {
          copyStatus.textContent = '클립보드 복사를 사용할 수 없습니다. 브라우저의 복사 권한을 확인하세요.';
        }
      });
      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('div');
      const addText = (message) => {
        const line = document.createElement('p');
        line.textContent = message;
        root.appendChild(line);
      };
      // 서버·제공 화면의 표준 오류만 표시한다. 비밀이나 원문 예외를 그대로 표시하지 않는다.
      const secret = /Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+/i;
      const safeText = (value, fallback = '확인 불가') =>
        typeof value === 'string' && value.trim() && value.length <= 500 &&
        !secret.test(value) && !/[\u0000-\u001f]/.test(value) ? value : fallback;
      const errorGuide = {
        ON_AI_PROVISIONING_PENDING: '앱 이용 권한 준비 중입니다(운영 측 준비 사항이며 학생 코드 오류가 아닙니다). 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        ON_AI_AUTHORIZATION_CHANGED: '앱 권한이 변경됐습니다. 담당자에게 현재 권한을 확인하세요.',
        SUBJECT_SCOPE_UNVERIFIED: '현재 계정·프로젝트 연결을 확인할 수 없습니다. 계정 연결을 다시 확인하세요.',
        AI_REQUEST_UNVERIFIED: 'AI 연결이나 응답을 확인할 수 없습니다(확인 불가). 담당자에게 계정 연결과 앱 권한 확인을 요청하세요.',
        WB_CLCO_AUTH_REQUIRED: '인증에 실패했습니다. 계정 연결을 다시 확인하고 담당자에게 문의하세요.',
        WB_CLCO_ACCESS_BLOCKED: 'AI 이용 권한이 제한됐습니다. 담당자에게 접근 권한을 확인하세요.',
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반의 AI 사용량이 소진됐습니다. 담당자에게 확인하세요.',
        WB_CLCO_LIMIT_REACHED: 'AI 이용 한도에 도달했습니다. 담당자에게 확인하세요.',
        WB_CLCO_SESSION_CLOSED: '현재 AI 이용 시간이 아닙니다. 이용 가능 시간을 확인하세요.',
        WB_CLCO_RATE_LIMITED: '요청 제한 상태입니다. 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_NETWORK_ERROR: 'AI 게이트 네트워크 오류입니다. 인터넷 연결을 확인하고 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_SERVER_UNAVAILABLE: 'AI 게이트 서버를 사용할 수 없습니다. 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_INVALID_RESPONSE: 'AI 게이트 응답 형식이 확인되지 않았습니다. 담당자에게 게이트 버전과 연결 상태를 확인하세요.',
        WB_CLCO_TIMEOUT: 'AI 응답 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
        REQUEST_TIMEOUT: 'AI 요청 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
        ENGINE_TIMEOUT: '서버 점검 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
        TIMEOUT: 'AI 응답 시간이 초과됐습니다. 잠시 뒤 직접 다시 점검하세요.',
        WB_CLCO_CANCELLED: 'AI 연결 점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
        REQUEST_CANCELLED: 'AI 연결 점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
        CANCELLED: 'AI 연결 점검이 취소됐습니다. 이전 결과는 현재 결과가 아닙니다.',
        MODEL_NOT_CONFIGURED: '사용 가능한 모델 설정을 확인할 수 없습니다. 담당자에게 문의하세요.',
        ON_AI_MODEL_LIST_EMPTY: '현재 앱 권한으로 사용할 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.',
        ON_AI_INVALID_INPUT: '점검에 필요한 정보가 유효하지 않습니다. 담당자에게 확인하세요.',
        ON_AI_INVALID_OUTPUT: 'AI 응답을 검증할 수 없습니다. 담당자에게 확인하세요.',
      };
      const modeLabels = { connected: '연결됨', demo: '예제 자료', disconnected: '연결 없음', unknown: '확인 불가' };
      addText('앱 내부 AI 연결 점검');
      addText(`서버 자료 연결 상태: ${modeLabels[mode] || '확인 불가'}`);
      const manual = '다시 점검하려면 「AI 연결 점검」 버튼을 직접 누르세요. 자동으로 다시 요청하지 않습니다.';

      if (status === 'idle') {
        addText('AI 연결 점검 전');
        addText('이전 점검 결과는 현재 상태를 나타내지 않습니다.');
        addText(manual);
        return root;
      }
      if (status === 'loading') {
        addText('AI 연결 점검 중');
        addText('아직 연결 성공이나 사건 설명 성공으로 판단할 수 없습니다.');
        return root;
      }
      if (status === 'error') {
        const code = typeof error?.code === 'string' && Object.hasOwn(errorGuide, error.code)
          ? error.code : 'AI_REQUEST_UNVERIFIED';
        addText(`AI 연결 점검 실패 · 오류 코드: ${code}`);
        addText(`오류 메시지: ${safeText(error?.message, '안전하게 확인된 오류 메시지가 없습니다.')}`);
        addText(errorGuide[code]);
        addText('이 결과는 사건 설명 성공을 의미하지 않습니다.');
        addText(manual);
        return root;
      }
      if (status !== 'ok' || data?.transportChecked !== true ||
          !['test', 'verified'].includes(data?.audienceAuthorization) ||
          !Number.isInteger(data?.modelCount) || data.modelCount < 0) {
        addText('AI 연결 점검 결과를 확인할 수 없습니다.');
        addText(manual);
        return root;
      }
      if (data.audienceAuthorization === 'test') {
        addText('시험 연결 점검(test) · 실제 앱 이용 권한 확인은 아닙니다.');
      } else {
        addText('앱 권한 확인 후 점검(verified)');
      }
      addText(`응답 모델 수(modelCount): ${data.modelCount}`);
      addText(`점검 시각(checkedAt): ${safeText(checkedAt)}`);
      if (mode === 'demo') addText('예제 응답(demo)은 실제 AI 게이트 연결 성공을 증명하지 않습니다.');
      // explanationAccepted는 이 입력 계약에서 false다. 설명 요청의 성공은 별도의 renderExplanation에서만 표시한다.
      addText('연결 상태만 점검했습니다. 사건 설명은 아직 실행하지 않았습니다.');
      addText(manual);
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('div');
      const addText = (message) => {
        const line = document.createElement('p');
        line.textContent = message;
        root.appendChild(line);
      };
      const secret = /Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+/i;
      const safeText = (value, fallback = '확인 불가') =>
        typeof value === 'string' && value.trim() && value.length <= 1500 &&
        !secret.test(value) && !/[\u0000-\u001f]/.test(value) ? value : fallback;
      const safeCode = (value) => typeof value === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value)
        ? value : 'AI_REQUEST_UNVERIFIED';
      addText('보안 기록 AI 설명');
      if (explanation?.status === 'idle' || !explanation) {
        addText('사건 설명을 아직 요청하지 않았습니다.');
        return root;
      }
      if (explanation.status === 'loading') {
        addText('보안 사건 설명 요청 중 · 아직 결과를 확인하지 못했습니다.');
        return root;
      }
      if (explanation.status === 'error') {
        addText(`사건 설명 실패 · 오류 코드: ${safeCode(explanation.error?.code)}`);
        addText(`오류 메시지: ${safeText(explanation.error?.message, '안전하게 확인된 오류 메시지가 없습니다.')}`);
        addText('기존 보안 기록은 그대로 유지됩니다. 사건 설명 실패는 기록 삭제나 조치 실행이 아닙니다.');
        return root;
      }
      const validId = typeof event?.id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/.test(event.id);
      const summary = explanation?.data?.summary;
      if (explanation.status !== 'ok' || !validId ||
          typeof summary !== 'string' || !summary.trim() ||
          safeText(summary) === '확인 불가') {
        addText('사건 설명 결과를 확인할 수 없습니다.');
        return root;
      }
      root.setAttribute('data-student-explanation-event', event.id);
      addText(`사건 ID: ${event.id}`);
      addText(`AI 사건 설명 요약: ${summary}`);
      addText('AI가 작성한 설명은 참고용이며 보안 기록이나 원천 상태를 변경하지 않았습니다.');
      return root;
    },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
