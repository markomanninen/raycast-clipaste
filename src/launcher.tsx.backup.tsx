
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  Toast,
  getPreferenceValues,
  showHUD,
  showToast,
  useNavigation,
  Clipboard,
} from "@raycast/api";
import { useExec, useLocalStorage, usePromise } from "@raycast/utils";
import { useEffect, useMemo } from "react";
import recipes from "../assets/clipaste-recipes.json";

type Mode = "copy" | "get" | "paste" | "status" | "clear" | "ai";

type FormValues = {
  mode: Mode;
  text?: string;
  file?: string[];
  output?: string;
  filename?: string;
  type?: "auto" | "text" | "image" | "binary";
  format?: "png" | "jpeg" | "webp" | "";
  quality?: string;
  autoExtension?: boolean;
  dryRun?: boolean;
  raw?: boolean;
  aiAction?: "summarize" | "classify" | "transform";
  aiLabels?: string;
  aiInstruction?: string;
  templateArgs?: string;
  recipeId?: string;
  clipOffset?: number;
};

type Prefs = {
  clipastePath: string;
  defaultOutputDir?: string;
  enablePngpaste?: boolean;
  pngpastePath?: string;
};

function buildArgs(values: FormValues): string[] {
  const args: string[] = [];

  if (values.recipeId) {
    const match = (recipes as any).recipes.find((r: any) => r.id === values.recipeId);
    if (match) args.push(...(match.args as string[]));
  }

  switch (values.mode) {
    case "copy":
      args.push("copy");
      if (values.file?.length) args.push("--file", values.file[0]);
      else if (values.text?.trim()?.length) args.push(values.text);
      break;
    case "get":
      args.push("get");
      if (values.raw) args.push("--raw");
      break;
    case "paste":
      args.push("paste");
      if (values.output?.trim()?.length) args.push("--output", values.output);
      if (values.filename?.trim()?.length) args.push("--filename", values.filename);
      if (values.type && values.type !== "auto") args.push("--type", values.type);
      if (values.format) args.push("--format", values.format);
      if (values.quality?.trim()?.length) args.push("--quality", values.quality);
      if (values.autoExtension) args.push("--auto-extension");
      if (values.dryRun) args.push("--dry-run");
      break;
    case "status":
      args.push("status");
      break;
    case "clear":
      args.push("clear", "--confirm");
      break;
    case "ai":
      args.push("ai");
      const act = values.aiAction ?? "summarize";
      args.push(act);
      if (act === "classify" && values.aiLabels) args.push("--labels", values.aiLabels);
      if (act === "transform" && values.aiInstruction) args.push("--instruction", values.aiInstruction);
      break;
  }

  if (values.templateArgs?.trim()) {
    const extra = values.templateArgs.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
    args.push(...extra.map((s) => s.replace(/^"|"$/g, "")));
  }

  return args;
}

export default function Command() {
  const prefs = getPreferenceValues<Prefs>();
  const { push } = useNavigation();

  const { value: stored, setValue: setStored, isLoading } =
    useLocalStorage<FormValues>("clipaste.form", { mode: "paste", type: "auto", clipOffset: 0 });

  const values: FormValues = stored ?? { mode: "paste", type: "auto", clipOffset: 0 };

  function update(patch: Partial<FormValues>) {
    const next: FormValues = { ...values, ...patch };
    void setStored(next);
  }

  const { data: clip, isLoading: clipLoading, revalidate: refreshClip } = usePromise(
    (off: number) => Clipboard.read({ offset: off }),
    [values.clipOffset ?? 0]
  );

  const cli = prefs.clipastePath || "clipaste";
  const previewArgs = useMemo(() => buildArgs(values), [values]);
  const previewCmd = useMemo(() => `$ ${cli} ${previewArgs.map(shellQuote).join(" ")}`, [previewArgs, cli]);

  function onSubmit(v: FormValues) {
    const out = v.output?.trim()?.length ? v.output : prefs.defaultOutputDir || "";
    const merged = { ...v, output: out };
    const args = buildArgs(merged);
    push(<ResultView cli={cli} args={args} />);
  }

  if (isLoading && !stored) {
    return <Detail markdown={"Loading…"} />;
  }

  const clipPreview = useMemo(() => {
    if (!clip) return "(no clipboard data)";
    const parts: string[] = [];
    if (clip.text) parts.push(clip.text.length > 300 ? clip.text.slice(0, 300) + "…" : clip.text);
    if (clip.file) parts.push(`File: ${clip.file}`);
    if (clip.html) {
      const stripped = clip.html.replace(/<[^>]*>/g, "");
      parts.push(`HTML: ${stripped.length > 200 ? stripped.slice(0, 200) + "…" : stripped}`);
    }
    return parts.join("\\n\\n");
  }, [clip]);

  return (
    <Form
      enableDrafts
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run clipaste" onSubmit={onSubmit} />
          <Action.CopyToClipboard title="Copy Command" content={previewCmd} />
          <Action title="Refresh Clipboard Preview" onAction={() => refreshClip()} />
          <Action.Push title="Open Clipboard Preview" target={<ClipboardPreviewDetail clip={clip} onRefresh={() => refreshClip()} />} />
          {prefs.enablePngpaste ? (
            <Action.Push title="Generate PNG Preview (pngpaste)" target={<PngpastePreviewDetail pngpastePath={prefs.pngpastePath || "pngpaste"} />} />
          ) : null}
          <Action.OpenInBrowser title="Open Project (clipaste)" url="https://github.com/markomanninen/clipaste" />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="mode" title="Mode" value={values.mode} onChange={(v) => update({ mode: v as Mode })}>
        <Form.Dropdown.Item title="paste" value="paste" />
        <Form.Dropdown.Item title="copy" value="copy" />
        <Form.Dropdown.Item title="get" value="get" />
        <Form.Dropdown.Item title="status" value="status" />
        <Form.Dropdown.Item title="clear" value="clear" />
        <Form.Dropdown.Item title="ai (optional)" value="ai" />
      </Form.Dropdown>

      <Form.Separator />

      <Form.Description title="Clipboard Preview" text={clipLoading ? "(loading…)" : clipPreview} />
      <Form.Dropdown id="clipOffset" title="Clipboard History Offset" value={String(values.clipOffset ?? 0)} onChange={(v) => update({ clipOffset: Number(v) })}>
        <Form.Dropdown.Item title="Current (0)" value="0" />
        <Form.Dropdown.Item title="Prev 1" value="1" />
        <Form.Dropdown.Item title="Prev 2" value="2" />
        <Form.Dropdown.Item title="Prev 3" value="3" />
        <Form.Dropdown.Item title="Prev 4" value="4" />
        <Form.Dropdown.Item title="Prev 5" value="5" />
      </Form.Dropdown>

      <Form.Separator />

      <Form.Description title="Recipe (optional)" text="Pick a saved recipe or leave empty." />
      <Form.Dropdown id="recipeId" title="Recipe" value={values.recipeId ?? ""} onChange={(v) => update({ recipeId: v || undefined })}>
        <Form.Dropdown.Item title="— none —" value="" />
        {(recipes as any).recipes.map((r: any) => <Form.Dropdown.Item key={r.id} title={r.label} value={r.id} />)}
      </Form.Dropdown>
      <Form.TextField id="templateArgs" title="Extra Args (free text)" placeholder='e.g. --auto-extension --filename "screenshot"' value={values.templateArgs ?? ""} onChange={(v) => update({ templateArgs: v })} />

      {values.mode === "copy" && (<>
        <Form.TextArea id="text" title="Text" value={values.text ?? ""} onChange={(v) => update({ text: v })} />
        <Form.FilePicker id="file" title="File" allowMultipleSelection={false} onChange={(v) => update({ file: v })} />
      </>)}

      {values.mode === "get" && (
        <Form.Checkbox id="raw" label="Raw (no newline)" value={values.raw ?? false} onChange={(v) => update({ raw: v })} />
      )}

      {values.mode === "paste" && (<>
        <Form.TextField id="output" title="Output Directory" placeholder="Leave blank to use Preference" value={values.output ?? ""} onChange={(v) => update({ output: v })} />
        <Form.TextField id="filename" title="Filename (no extension if auto)" value={values.filename ?? ""} onChange={(v) => update({ filename: v })} />
        <Form.Dropdown id="type" title="Type (force)" value={values.type ?? "auto"} onChange={(v) => update({ type: v as any })}>
          <Form.Dropdown.Item title="auto" value="auto" />
          <Form.Dropdown.Item title="text" value="text" />
          <Form.Dropdown.Item title="image" value="image" />
          <Form.Dropdown.Item title="binary" value="binary" />
        </Form.Dropdown>
        <Form.Dropdown id="format" title="Image Format" value={values.format ?? ""} onChange={(v) => update({ format: (v as any) })}>
          <Form.Dropdown.Item title="(none)" value="" />
          <Form.Dropdown.Item title="png" value="png" />
          <Form.Dropdown.Item title="jpeg" value="jpeg" />
          <Form.Dropdown.Item title="webp" value="webp" />
        </Form.Dropdown>
        <Form.TextField id="quality" title="Quality (jpeg/webp)" placeholder="0-100" value={values.quality ?? ""} onChange={(v) => update({ quality: v })} />
        <Form.Checkbox id="autoExtension" label="Auto extension" value={values.autoExtension ?? true} onChange={(v) => update({ autoExtension: v })} />
        <Form.Checkbox id="dryRun" label="Dry run (preview only)" value={values.dryRun ?? false} onChange={(v) => update({ dryRun: v })} />
      </>)}

      {values.mode === "ai" && (<>
        <Form.Dropdown id="aiAction" title="AI Action" value={values.aiAction ?? "summarize"} onChange={(v) => update({ aiAction: v as any })}>
          <Form.Dropdown.Item title="summarize" value="summarize" />
          <Form.Dropdown.Item title="classify" value="classify" />
          <Form.Dropdown.Item title="transform" value="transform" />
        </Form.Dropdown>
        <Form.TextField id="aiLabels" title="Labels (classify)" placeholder="bug,feature,question" value={values.aiLabels ?? ""} onChange={(v) => update({ aiLabels: v })} />
        <Form.TextArea id="aiInstruction" title="Instruction (transform)" value={values.aiInstruction ?? ""} onChange={(v) => update({ aiInstruction: v })} />
      </>)}

      <Form.Separator />
      <Form.Description title="Command Preview" text={previewCmd} />
    </Form>
  );
}

function ResultView(props: { cli: string; args: string[] }) {
  const { cli, args } = props;
  const cmdString = `$ ${cli} ${args.map(shellQuote).join(" ")}`;

  const { isLoading, data, error, revalidate } = useExec(cli, args, {
    shell: true,
    onError: (e) => { void showToast(Toast.Style.Failure, "Clipaste error", String(e)); },
    onData: () => showHUD("✅ Done"),
  });

  useEffect(() => { if (error) showToast(Toast.Style.Failure, "Clipaste error", String(error)); }, [error]);

  const outputText =
    (() => {
      if (typeof data === "string") return data;
      if (data && (data as any).toString) {
        try {
          return (data as any).toString("utf8");
        } catch {
          return String(data);
        }
      }
      return "";
    })().trim() || "(no output)";

  const md = [
    `# ${isLoading ? "Running clipaste…" : error ? "❌ Error" : "✅ Done"}`,
    "", "```bash", cmdString, "```", "", "## Output", "", "```", 
    "```",
    outputText,
    "```",
  ].join("\\n");

  return (
    <Detail
      navigationTitle="Clipaste Result"
      markdown={md}
      actions={<ActionPanel><Action.CopyToClipboard title="Copy Command" content={cmdString} /><Action title="Run Again" onAction={() => revalidate()} /></ActionPanel>}
    />
  );
}

function ClipboardPreviewDetail(props: { clip?: { text?: string; file?: string; html?: string }, onRefresh: () => void }) {
  const c = props.clip;
  let md = `# Clipboard Preview\\n`;
  if (!c) md += `\\n(no clipboard data)\\n`;
  else {
    if (c.text) md += `\\n## Text\\n\\n\\\`\\\`\\\`\\n${c.text}\\n\\\`\\\`\\\`\\n`;
    if (c.file) {
      const lower = c.file.toLowerCase();
      const isImage = lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif");
      md += `\\n## File\\n\\n\\\`${c.file}\\\`\\n\\n`;
      if (isImage) md += `![clipboard-image](${c.file})\\n`;
    }
    if (c.html) md += `\\n## HTML (raw)\\n\\n\\\`\\\`\\\`html\\n${c.html}\\n\\\`\\\`\\\`\\n`;
  }
  return (
    <Detail
      markdown={md}
      actions={<ActionPanel><Action title="Refresh" onAction={props.onRefresh} />{c?.text ? <Action.CopyToClipboard title="Copy Text" content={c.text} /> : null}{c?.file ? <Action.CopyToClipboard title="Copy File Path" content={c.file} /> : null}</ActionPanel>}
    />
  );
}

function PngpastePreviewDetail(props: { pngpastePath: string }) {
  const bin = props.pngpastePath || "pngpaste";
  const cmd = `bash -lc 'if ! command -v "${bin}" >/dev/null 2>&1; then echo "__NOPNGPASTE__"; exit 127; fi; TMP="$(mktemp -t clipaste-preview)"; OUT="\${TMP}.png"; if "${bin}" "\${OUT}"; then echo "\${OUT}"; else echo "__ERROR__"; fi'`;
  const { isLoading, data, error, revalidate } = useExec(cmd, [], { shell: true });

  let md = `# pngpaste Preview\\n`;
  if (isLoading) md += `\\n(working…)\\n`;
  else if (error) md += `\\n**Error:** ${String(error)}\\n`;
  else if (data) {
    const out = (data as string).trim();
    if (out === "__NOPNGPASTE__") md += "\\n`pngpaste` not found.\\n\\nInstall with:\\n\\n```bash\\nbrew install pngpaste\\n```\\n";
    else if (out === "__ERROR__" || out === "") md += "\\nCould not dump clipboard image via pngpaste. Make sure the clipboard holds an image.\\n";
    else md += "\\nSaved to `" + out + "`.\\n\\n![clipboard-image](" + out + ")\\n";
  }
  return <Detail markdown={md} actions={<ActionPanel><Action title="Run Again" onAction={() => revalidate()} /><Action.CopyToClipboard title="Copy Output Path" content={(data ?? '').trim?.() ?? ''} /></ActionPanel>} />;
}

function shellQuote(s: string): string {
  if (/^[a-zA-Z0-9_\/\.\-]+$/.test(s)) return s;
  return '"' + s.replace(/"/g, '\\"') + '"';
}
