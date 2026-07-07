"use client";

import { PageHeader } from "@/components/PageHeader";
import { StateBadge } from "@/components/StateBadge";
import { CopyButton } from "@/components/CopyButton";
import { HOSTED } from "@/lib/connection";
import type { DeploymentState } from "@/lib/types";
import { useOrigin } from "@/lib/useOrigin";

const SECTIONS = [
  { id: "connect", label: "Connect" },
  { id: "overview", label: "Overview" },
  { id: "deploy", label: "Deploy" },
  { id: "playground", label: "Playground" },
  { id: "states", label: "States" },
  { id: "api", label: "Call it from code" },
  { id: "security", label: "Security" },
];

const STATE_ORDER: DeploymentState[] = [
  "requested",
  "provisioning",
  "booting",
  "downloading_model",
  "starting_server",
  "ready",
  "degraded",
  "stopping",
  "stopped",
  "failed",
];

const STATE_DOC: Record<DeploymentState, string> = {
  requested: "Queued. The reconciler will acquire a pod on the next tick.",
  provisioning: "Renting the GPU pod from the provider.",
  booting: "The pod is powering on.",
  downloading_model: "Pulling the model weights (the slow step on a cold start).",
  starting_server: "vLLM is loading the model into GPU memory.",
  ready: "Serving. Use it in the Playground or via the API.",
  degraded: "Was ready, now failing health checks. Still billing.",
  stopping: "Tearing the pod down.",
  stopped: "Torn down. No longer billing.",
  failed: "Gave up after retries. Check the event log on the detail page.",
};

export function WorkbenchDocs() {
  const origin = useOrigin();
  const corsCmd = `gpu serve --cors-origin ${origin || "https://<this-page-origin>"}`;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Docs" sub="How to drive the workbench." />

      <nav className="mb-10 flex flex-wrap gap-x-4 gap-y-1">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="ol-label transition-colors hover:text-ink">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        <Section id="connect" title="Connect to a server">
          <P>
            The workbench is a thin client over a local <Code>open-lease</Code> server. It never
            holds your provider credentials; it just calls the server&rsquo;s REST API and streams
            chat through its OpenAI-compatible proxy.
          </P>
          {HOSTED ? (
            <>
              <P>
                Start your server with this page allowed as a cross-origin caller, then connect from
                the sidebar. Your server URL and token stay in this browser and are sent only to your
                machine.
              </P>
              <Cmd label="On your machine">{corsCmd}</Cmd>
              <P>
                Needs the API extra: <Code>pip install &apos;open-lease[api]&apos;</Code>. Add{" "}
                <Code>--api-token</Code> on the server and paste the same token when you connect.
              </P>
            </>
          ) : (
            <>
              <P>
                You&rsquo;re running the bundled workbench, so it already talks to the server that
                served it. One command boots the API, the proxy, and this UI together:
              </P>
              <Cmd label="Launch">gpu ui</Cmd>
              <P>
                To point the browser build at a remote server instead, host it and run{" "}
                <Code>{corsCmd}</Code> on the machine with the GPUs.
              </P>
            </>
          )}
        </Section>

        <Section id="overview" title="Overview">
          <P>
            Every deployment is a card: its state, the GPU, uptime, the cost accrued so far (ticking
            live between polls), and the endpoint once it&rsquo;s serving. The list refreshes about
            once a second, so you watch a deployment climb to Ready in real time. Click a card for
            the full detail view: the event log, the state timeline, health, and logs.
          </P>
        </Section>

        <Section id="deploy" title="Deploy a model">
          <P>
            Two ways in. <Strong>Catalog model</Strong> picks a validated entry and its recommended
            GPU. <Strong>Any HF model</Strong> deploys any vLLM-servable Hugging Face repo ad hoc
            (the CLI equivalent is <Code>gpu deploy --hf-repo</Code>); you choose the GPU and,
            optionally, a context length.
          </P>
          <P>
            The form shows the hourly rate and whether a data center has capacity right now. Deploy
            is non-blocking: a background daemon drives the pod to Ready. If none is running, start
            one with <Code>gpu up</Code>.
          </P>
        </Section>

        <Section id="playground" title="Playground">
          <P>
            Pick a Ready deployment and chat with it. Messages stream token-by-token through the
            OpenAI-compatible proxy, which routes by model name to the right pod. Enter sends;
            Shift+Enter adds a newline; Stop aborts an in-flight response.
          </P>
        </Section>

        <Section id="states" title="Deployment states">
          <P>A deployment moves through these on its way to Ready and back down:</P>
          <ul className="mt-1 space-y-2.5">
            {STATE_ORDER.map((s) => (
              <li key={s} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="w-36 shrink-0">
                  <StateBadge state={s} />
                </span>
                <span className="text-small text-ink-muted">{STATE_DOC[s]}</span>
              </li>
            ))}
          </ul>
          <P>
            A pulsing dot means it&rsquo;s working toward Ready. A pod bills from Provisioning through
            Degraded (anytime it exists on the provider), not once it&rsquo;s Stopped or Failed.
          </P>
        </Section>

        <Section id="api" title="Call it from code">
          <P>
            Open any deployment&rsquo;s detail page for an <Strong>API</Strong> panel: the base URL,
            the model name, and copy-paste cURL / Python / JavaScript that POST a chat completion.
            It&rsquo;s OpenAI-compatible, so any OpenAI SDK works by pointing its <Code>base_url</Code>{" "}
            at your server&rsquo;s <Code>/v1</Code> and using the deployment&rsquo;s model name.
          </P>
        </Section>

        <Section id="security" title="Security &amp; privacy">
          <ul className="space-y-2.5">
            <Li>
              <Strong>Your data stays local.</Strong> The server URL and token live in this
              browser&rsquo;s storage. Requests go straight to your machine, never through a third
              party.
            </Li>
            <Li>
              <Strong>The token guards everything.</Strong> If you set <Code>--api-token</Code>,
              every management and inference route requires it.
            </Li>
            <Li>
              <Strong>Cross-origin is opt-in.</Strong> A hosted workbench can only reach your server
              if you start it with <Code>--cors-origin</Code> for that exact page. It&rsquo;s off by
              default and never wildcarded, so a running server isn&rsquo;t exposed to other sites.
            </Li>
          </ul>
        </Section>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-h2 text-ink-strong">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-body text-ink-muted">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return <li className="text-body text-ink-muted">{children}</li>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-strong">{children}</span>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-small text-accent-soft">
      {children}
    </code>
  );
}

function Cmd({ label, children }: { label: string; children: string }) {
  return (
    <div className="rounded-lg border border-rule bg-surface p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="ol-label">{label}</span>
        <CopyButton value={children} />
      </div>
      <pre
        className="overflow-auto rounded-md bg-canvas p-3 font-mono text-label text-ink"
        style={{ fontFeatureSettings: '"liga" 0, "calt" 0' }}
      >
        {children}
      </pre>
    </div>
  );
}
