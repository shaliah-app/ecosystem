import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { jobType, process, schema } from "../src/jobs/processNewRecord.ts";

// Mock job context
const mockContext = {
  jobId: "test-job-id",
  logger: {
    info: () => {},
    warn: () => {},
    error: () => {},
  },
  supabase: {} as any,
};

Deno.test("processNewRecord - valid payload", async () => {
  const validPayload = {
    record_id: 123,
    record_type: "song",
    metadata: { source: "upload" },
  };

  // Should not throw
  await process(validPayload, mockContext);
});

Deno.test("processNewRecord - minimal payload", async () => {
  const minimalPayload = {
    record_id: 456,
  };

  // Should not throw
  await process(minimalPayload, mockContext);
});

Deno.test("processNewRecord schema validation", () => {
  // Valid payload
  const validResult = schema.safeParse({
    record_id: 123,
    record_type: "song",
  });
  assertEquals(validResult.success, true);

  // Invalid payload - missing record_id
  const invalidResult = schema.safeParse({
    record_type: "song",
  });
  assertEquals(invalidResult.success, false);
});

Deno.test("processNewRecord job type", () => {
  assertEquals(jobType, "process_new_record");
});
