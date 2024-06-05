import { cleanup, renderHook, act } from "@testing-library/react";
import { afterEach, describe, test } from "vitest";
import { useMode } from "./use-mode";

describe.concurrent("useMode", () => {
	afterEach(cleanup);

	test("Dummy test - test if renders without errors", ({ expect }) => {
		const { result } = renderHook(() => useMode());
    act(() => result.current.setValue(10));
    expect(result.current.value).toBe(10);
	});
});

