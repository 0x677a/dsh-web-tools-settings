import z from "@deepseek-ai/schemastery";
import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import { applyWebFetchTool } from "@deepseek-ai/dsh-tool-web";

/** Settings namespace served to the Web client by the rc.6 compatibility patch. */
export const WEB_TOOLS_SETTINGS_NAMESPACE = settingsNamespace("web-tools");

/**
 * The values are intentionally conservative: installing the plugin does not
 * make a network-capable model tool appear until the user turns it on.
 */
export const Config = z.object({
  enabled: z.boolean().default(false),
  fetchTimeoutMs: z.number().step(1).min(1000).max(300000).default(30000),
  fetchMaxOutputChars: z.number().step(1).min(1000).max(1000000).default(200000)
});

export const name = "dsh-web-tools-settings";
export const inject = [];

/**
 * Register web_fetch from a disposable child fiber. Rebuilding that child on
 * settings changes is what makes the checkbox a real runtime switch: the
 * tool and its system-prompt section are both removed when disabled.
 */
export function apply(ctx, config) {
  let current = () => config;
  let active;
  let serial = Promise.resolve();
  let generation = 0;

  const reconcile = () => {
    const requested = ++generation;
    serial = serial.then(async () => {
      const previous = active;
      active = void 0;
      if (previous !== void 0) await previous.dispose();

      const value = current();
      if (requested !== generation || !value.enabled) return;

      const child = ctx.plugin({
        name: "dsh-web-tools-settings:fetch-tool",
        inject: ["tools", "web", "systemPrompt"],
        apply(childCtx) {
          applyWebFetchTool(childCtx, value.fetchTimeoutMs, value.fetchMaxOutputChars);
        }
      });
      const fiber = await child;
      if (requested !== generation) {
        await fiber.dispose();
        return;
      }
      active = fiber;
    }).catch((error) => {
      ctx.logger.error("dsh-web-tools-settings failed to reconcile web_fetch");
      ctx.logger.error(error);
    });
    return serial;
  };

  installSettingsSection(ctx, WEB_TOOLS_SETTINGS_NAMESPACE, Config, config, {
    // Newer DSH versions understand this declaration. rc.6 ignores unknown
    // hook properties; scripts/patch-host-apiproxy.ps1 supplies the rc.6 seam.
    expose: "web",
    setSource: (source) => {
      current = source;
    },
    onChange: () => {
      void reconcile();
    }
  });

  ctx.effect(() => () => {
    generation += 1;
    const previous = active;
    active = void 0;
    return previous?.dispose();
  }, "dsh-web-tools-settings: dispose fetch tool");
}
