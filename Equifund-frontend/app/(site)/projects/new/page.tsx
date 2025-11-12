"use client";

import { useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { isAddress } from "viem";

import Hero from "@/components/hero";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useProjectRegistryOwner } from "@/hooks/useProjectRegistryOwner";
import { PROJECT_REGISTRY } from "@/lib/address";
import { PROJECT_REGISTRY_ABI } from "@/abi/projectRegistry";

export default function RegisterProjectPage() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: owner, isLoading: ownerLoading } = useProjectRegistryOwner();
  const { writeContractAsync } = useWriteContract();
  const { toast } = useToast();

  const [projectAddress, setProjectAddress] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metadataURI, setMetadataURI] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addressIsValid = isAddress(projectAddress ?? "");
  const formIsValid =
    addressIsValid &&
    name.length > 2 &&
    description.length > 10 &&
    metadataURI.length > 5;
  const isOwner =
    owner && address && owner.toLowerCase() === address.toLowerCase();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formIsValid || !publicClient) return;

    try {
      setIsSubmitting(true);
      const hash = await writeContractAsync({
        address: PROJECT_REGISTRY,
        abi: PROJECT_REGISTRY_ABI,
        functionName: "registerProject",
        args: [
          projectAddress as `0x${string}`,
          name.trim(),
          description.trim(),
          metadataURI.trim(),
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      toast({
        title: "Project registered",
        description: `${name} has been added to the registry.`,
      });

      setProjectAddress("");
      setName("");
      setDescription("");
      setMetadataURI("");
    } catch (error) {
      console.error("register project error", error);
      toast({
        title: "Registration failed",
        description:
          error instanceof Error
            ? error.message
            : "Unable to register project.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-24 pb-24">
      <Hero variant="projects" />

      <section className="px-4">
        <div className="max-w-3xl mx-auto rounded-3xl border border-primary/20 bg-primary/5 p-10">
          <h2 className="text-3xl font-bold mb-3">Register a new project</h2>
          <p className="text-muted-foreground mb-8">
            Projects can only be registered by the ProjectRegistry owner.
            Provide accurate metadata so donors can understand the public good
            they are supporting.
          </p>

          {ownerLoading ? (
            <p className="text-sm text-muted-foreground">
              Fetching registry owner…
            </p>
          ) : !isConnected ? (
            <p className="rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
              Connect your wallet to continue.
            </p>
          ) : !isOwner ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Only the ProjectRegistry owner can register new projects.
              Connected wallet: {address}.
            </p>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="project-address"
                >
                  Project Address
                </label>
                <Input
                  id="project-address"
                  value={projectAddress}
                  onChange={(event) => setProjectAddress(event.target.value)}
                  placeholder="0x..."
                  className="mt-2 font-mono"
                  required
                />
                {!addressIsValid && projectAddress.length > 0 && (
                  <p className="text-xs text-destructive mt-2">
                    Enter a valid Ethereum address.
                  </p>
                )}
              </div>

              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="project-name"
                >
                  Project Name
                </label>
                <Input
                  id="project-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="EquiFund Climate Initiative"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="project-description"
                >
                  Description
                </label>
                <Textarea
                  id="project-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Explain the mission, impact, and goals of this public good project."
                  className="mt-2 min-h-[120px]"
                  required
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-muted-foreground"
                  htmlFor="metadata-uri"
                >
                  Metadata URI
                </label>
                <Input
                  id="metadata-uri"
                  value={metadataURI}
                  onChange={(event) => setMetadataURI(event.target.value)}
                  placeholder="https://..."
                  className="mt-2"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={!formIsValid || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Registering…" : "Register Project"}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
