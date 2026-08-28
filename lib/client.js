window.__ModuleLoader__.load({
  id: "dsh-web-tools-settings",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    const React = require("react");
    const { createSnapshotStore } = require("@deepseek-ai/dsh-client-runtime/client");

    const LOCALE_NAMESPACE = "dshWebToolsSettings";
    const SETTINGS_NAMESPACE = "web-tools";
    const en = {
      title: "Web fetch",
      description: "Let the model fetch public web pages and read their text.",
      enabled: "Enable web_fetch",
      enabledHint: "When enabled, the model can retrieve an http(s) URL as text or Markdown.",
      timeout: "Fetch timeout (ms)",
      timeoutHint: "Maximum time allowed for one request.",
      maxChars: "Output limit (characters)",
      maxCharsHint: "The maximum amount of page text returned to the model.",
      unavailable: "This DSH deployment did not expose the web-tools settings namespace.",
      readOnly: "This deployment stores settings read-only.",
      save: "Save",
      saving: "Saving…",
      discard: "Discard",
      unsaved: "Unsaved changes",
      failed: "The deployment did not accept these values; the edits were kept.",
      security: "Only public HTTP(S) fetching is intended. The provider sends no browser cookies or login state."
    };
    const zh = {
      title: "网页抓取",
      description: "允许模型抓取公开网页并读取其中的文本。",
      enabled: "启用 web_fetch",
      enabledHint: "启用后，模型可以把 http(s) 网页抓取为文本或 Markdown。",
      timeout: "抓取超时（毫秒）",
      timeoutHint: "单次请求允许的最长时间。",
      maxChars: "输出上限（字符）",
      maxCharsHint: "返回给模型的网页文本最大长度。",
      unavailable: "当前 DSH 没有向网页端暴露 web-tools 设置命名空间。",
      readOnly: "当前部署的设置为只读。",
      save: "保存",
      saving: "保存中…",
      discard: "放弃修改",
      unsaved: "有未保存的修改",
      failed: "部署端没有接受这些值，修改仍保留在当前表单中。",
      security: "仅建议抓取公开 HTTP(S) 页面；该 provider 不携带浏览器 Cookie 或登录状态。"
    };

    function numberText(value, fallback) {
      return typeof value === "number" ? String(value) : String(fallback);
    }

    class WebToolsCardController {
      constructor(scope) {
        this.scope = scope;
        this.staged = new Map();
        this.saving = false;
        this.failed = false;
        this.listeners = new Set();
        this.store = createSnapshotStore(this.projection());
        scope.subscribe(() => this.publish());
      }
      snapshot() { return this.scope.getSnapshot(); }
      value(field, fallback) {
        const staged = this.staged.get(field);
        if (staged !== void 0) return staged;
        return this.snapshot().value?.[field] ?? fallback;
      }
      projection() {
        const snapshot = this.snapshot();
        return {
          available: snapshot.status === "ready",
          writable: snapshot.writable,
          enabled: Boolean(this.value("enabled", false)),
          fetchTimeoutMs: numberText(this.value("fetchTimeoutMs", 30000), 30000),
          fetchMaxOutputChars: numberText(this.value("fetchMaxOutputChars", 200000), 200000),
          dirty: this.staged.size > 0,
          saving: this.saving,
          failed: this.failed
        };
      }
      publish() {
        this.store.set(this.projection());
        for (const listener of this.listeners) listener();
      }
      subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
      edit(field, value) { this.staged.set(field, value); this.failed = false; this.publish(); }
      discard() { this.staged.clear(); this.failed = false; this.publish(); }
      async save() {
        if (this.saving || this.staged.size === 0) return;
        const writes = [...this.staged.entries()];
        this.saving = true;
        this.failed = false;
        this.publish();
        let ok = true;
        try {
          for (const [field, raw] of writes) {
            if (field === "enabled") { await this.scope.set(field, Boolean(raw)); continue; }
            const value = Number(raw);
            if (!Number.isInteger(value) || value < 1000) { ok = false; continue; }
            await this.scope.set(field, value);
          }
        } catch { ok = false; }
        this.saving = false;
        if (ok) this.staged.clear();
        this.failed = !ok;
        this.publish();
      }
      inject() {
        return {
          hooks: { webToolsCard: this.store },
          edit: (field, value) => this.edit(field, value),
          save: () => void this.save(),
          discard: () => this.discard()
        };
      }
    }

    const labelStyle = () => ({ color: "var(--dsw-alias-label-primary)", fontSize: 13, fontWeight: 500, lineHeight: 1.5 });
    const hintStyle = () => ({ color: "var(--dsw-alias-label-tertiary)", margin: "4px 0 0", fontSize: 12, lineHeight: 1.5 });

    function WebToolsCard(props) {
      const { t } = props;
      const state = props.useWebToolsCard((snapshot) => snapshot);
      const disabled = !state.writable || !state.available || state.saving;
      const inputStyle = { boxSizing: "border-box", width: "100%", height: 34, marginTop: 6, padding: "0 10px", border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 8, color: "var(--dsw-alias-label-primary)", background: "var(--dsw-alias-bg-layer-3)", font: "inherit" };
      const cardStyle = { border: "1px solid var(--dsw-alias-border-l2)", borderRadius: 12, padding: 16, color: "var(--dsw-alias-label-primary)", background: "var(--dsw-alias-bg-layer-3)" };
      const footerStyle = { display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--dsw-alias-border-l2)" };
      return React.createElement("li", { style: { listStyle: "none" } }, React.createElement("article", { style: cardStyle },
        React.createElement("h3", { style: { margin: 0, fontSize: 15 } }, t("title")),
        React.createElement("p", { style: hintStyle() }, t("description")),
        state.available ? React.createElement(React.Fragment, null,
          React.createElement("label", { style: { display: "flex", gap: 10, marginTop: 16, alignItems: "flex-start" } }, React.createElement("input", { type: "checkbox", checked: state.enabled, disabled, onChange: (event) => props.edit("enabled", event.target.checked), style: { marginTop: 3 } }), React.createElement("span", null, React.createElement("span", { style: labelStyle() }, t("enabled")), React.createElement("span", { style: hintStyle() }, t("enabledHint")))),
          React.createElement("label", { style: { display: "block", marginTop: 16 } }, React.createElement("span", { style: labelStyle() }, t("timeout")), React.createElement("input", { type: "number", min: 1000, step: 1000, value: state.fetchTimeoutMs, disabled, onChange: (event) => props.edit("fetchTimeoutMs", event.target.value), style: inputStyle }), React.createElement("span", { style: hintStyle() }, t("timeoutHint"))),
          React.createElement("label", { style: { display: "block", marginTop: 16 } }, React.createElement("span", { style: labelStyle() }, t("maxChars")), React.createElement("input", { type: "number", min: 1000, step: 1000, value: state.fetchMaxOutputChars, disabled, onChange: (event) => props.edit("fetchMaxOutputChars", event.target.value), style: inputStyle }), React.createElement("span", { style: hintStyle() }, t("maxCharsHint"))),
          React.createElement("p", { style: { ...hintStyle(), marginTop: 16 } }, t("security")),
          React.createElement("div", { style: footerStyle }, state.failed ? React.createElement("p", { role: "status", style: { ...hintStyle(), color: "var(--dsw-alias-label-error)", flex: 1 } }, t("failed")) : null, state.dirty ? React.createElement("span", { style: { ...hintStyle(), margin: "6px 0 0" } }, t("unsaved")) : null, React.createElement("button", { type: "button", disabled: disabled || !state.dirty, onClick: props.discard }, t("discard")), React.createElement("button", { type: "button", disabled: disabled || !state.dirty, onClick: props.save }, t(state.saving ? "saving" : "save")))
        ) : React.createElement("p", { role: "status", style: hintStyle() }, t("unavailable")),
        !state.available && state.writable === false ? React.createElement("p", { style: hintStyle() }, t("readOnly")) : null
      ));
    }

    const inject = ["slots", "locale", "connection", "remote", "settingsScope"];
    function apply(ctx) {
      const t = ctx.locale.bind(LOCALE_NAMESPACE);
      ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, { en, zh }), "dsh-web-tools-settings: locale");
      const controller = new WebToolsCardController(ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE }));
      // DSH >= 0.1.1 uses a keyed slot (key = settings namespace); 0.1.0-rc.x
      // used a list slot keyed by id. Try keyed first, fall back for old versions.
      ctx.slots.inject("settings.plugin.item", () => {
        const common = { name: "settings.plugin.item", locale: LOCALE_NAMESPACE, inject: () => ({ ...controller.inject(), t }) };
        try {
          ctx.slots.register({ ...common, key: SETTINGS_NAMESPACE }, WebToolsCard);
        } catch (err) {
          ctx.slots.register({ ...common, id: "dsh-web-tools-settings", order: 30 }, WebToolsCard);
        }
      });
    }
    exports.inject = inject;
    exports.apply = apply;
    return module.exports;
  }
});
