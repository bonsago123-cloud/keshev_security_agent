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
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
