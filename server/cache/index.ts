class CacheUtil {
    private cache: Map<string, any>
    constructor() {
        this.cache = new Map()
    }

    get(key: string): any | undefined {
        return this.cache.get(key)
    }

    set(key: string, value: any): void {
        this.cache.set(key, value)
    }

    has(key: string): boolean {
        return this.cache.has(key)
    }

    delete(key: string): boolean {
        return this.cache.delete(key)
    }

    clear(): void {
        this.cache.clear()
    }
}