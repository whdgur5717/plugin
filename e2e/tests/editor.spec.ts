import { test, expect } from "@playwright/test"

test.describe("Editor", () => {
	test("should load shell and canvas with Penpal connection", async ({ page }) => {
		await page.goto("/")

		// Shell UI 로드 확인
		await expect(page.locator(".app")).toBeVisible()

		// Canvas iframe 접근 (cross-origin)
		const canvasFrame = page.frameLocator("iframe.canvas-iframe")

		// Penpal 연결 완료 대기: "Loading..." 사라지고 canvas-app 표시
		// Canvas는 syncState 받기 전까지 Loading 표시 (App.tsx:60-62)
		await expect(canvasFrame.locator(".loading")).not.toBeVisible({ timeout: 5000 })
		await expect(canvasFrame.locator(".canvas-app")).toBeVisible()
	})

	test("should sync node click from canvas to shell", async ({ page }) => {
		await page.goto("/")

		const canvasFrame = page.frameLocator("iframe.canvas-iframe")

		// Penpal 연결 대기
		await expect(canvasFrame.locator(".canvas-app")).toBeVisible()

		// Canvas에서 노드 클릭 (현재는 .node-wrapper로 식별)
		// data-node-id 추가 후: canvasFrame.locator('[data-node-id="node-1"]')
		await canvasFrame.locator(".node-wrapper").first().click()

		// Shell 측: 노드 선택 시 empty-state 사라지고 design-tab 표시
		await expect(page.locator(".properties-panel .empty-state")).not.toBeVisible()
		await expect(page.locator(".properties-panel .design-tab")).toBeVisible()

		// Canvas 측: 선택된 노드에 .selected 클래스 추가됨
		await expect(canvasFrame.locator(".node-wrapper.selected")).toBeVisible()
	})
})
