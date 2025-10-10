import { beforeEach, describe, expect, test } from 'vitest';
import { BoxCollider, type Collider } from './index';

let collider: Collider;
beforeEach(() => {
	collider = new BoxCollider(24, 24);
});

const TAG_1 = 'tag-1' as const;
const TAG_2 = 'tag-2' as const;
const TAG_3 = 'tag-3' as const;
const tags = [TAG_1, TAG_2, TAG_3] as const;

describe('tags', () => {
	test('should start with no tags', () => {
		expect(collider.tag).toBe(undefined);
		expect(collider.tags).toHaveLength(0);
	});

	describe('add tag', () => {
		describe('`.tag =` shorthand', () => {
			test('should be able to add a tag', () => {
				collider.tag = TAG_1;
				expect(collider.tag).toBe(TAG_1);
				expect(collider.tags).toEqual([TAG_1]);
			});

			test('should override tag with second `.tag =` invocation', () => {
				collider.tag = TAG_1;
				collider.tag = TAG_2;
				expect(collider.tags).toEqual([TAG_2]);
			});

			test('should not be able to add a tag twice', () => {
				collider.tag = TAG_1;
				collider.addTag(TAG_1);
				expect(collider.tag).toBe(TAG_1);
				expect(collider.tags).toEqual([TAG_1]);
			});
		});

		describe('.addTag()', () => {
			test('should be able to add a tag', () => {
				collider.addTag(TAG_1);
				expect(collider.tag).toBe(TAG_1);
				expect(collider.tags).toEqual([TAG_1]);
			});

			test('should override tag with second `.tag =` invocation', () => {
				collider.addTag(TAG_1);
				collider.tag = TAG_2;
				expect(collider.tags).toEqual([TAG_2]);
			});

			test('should be able to add multiple tags', () => {
				collider.addTag(TAG_1);
				collider.addTag(TAG_2);
				expect(collider.tags).toEqual([TAG_1, TAG_2]);
			});

			test('should not be able to add a tag twice', () => {
				collider.addTag(TAG_1);
				collider.addTag(TAG_1);
				expect(collider.tags).toEqual([TAG_1]);
			});
		});

		describe('.addTags()', () => {
			test('should be able to add a tag', () => {
				collider.addTags(TAG_1);
				expect(collider.tag).toBe(TAG_1);
				expect(collider.tags).toEqual([TAG_1]);
			});

			test('should able to add multiple tags', () => {
				collider.addTags(TAG_1, TAG_2);
				expect(collider.tags).toEqual([TAG_1, TAG_2]);
			});

			test('should not be able to add a tag twice', () => {
				collider.addTags(TAG_1, TAG_1);
				expect(collider.tags).toEqual([TAG_1]);
			});
		});
	});

	describe('remove tag', () => {
		beforeEach(() => {
			collider.addTag(TAG_1);
			collider.addTag(TAG_2);
			collider.addTag(TAG_3);
		});

		test('`.tag =` shorthand should remove all tags', () => {
			collider.tag = 'override';
			expect(collider.tags).toEqual(['override']);
		});

		describe('.removeTag()', () => {
			tags.forEach((tag) => {
				test('should remove tag', () => {
					collider.removeTag(tag);
					expect(collider.tags).toHaveLength(2);
					expect(collider.tags).not.toContain(tag);
				});

				test('should not remove tag twice', () => {
					collider.removeTag(tag);
					collider.removeTag(tag);
					expect(collider.tags).toHaveLength(2);
					expect(collider.tags).not.toContain(tag);
				});
			});
		});

		describe('.removeTags()', () => {
			tags.forEach((tag) => {
				test('should remove tag', () => {
					collider.removeTags(tag);
					expect(collider.tags).toHaveLength(2);
					expect(collider.tags).not.toContain(tag);
				});

				test('should remove tags', () => {
					const tagsToRemove = tags.filter((t) => t !== tag);
					collider.removeTags(...tagsToRemove);
					expect(collider.tags).toHaveLength(1);
					expect(collider.tags).toContain(tag);
				});

				test('should not remove tag twice', () => {
					collider.removeTags(tag, tag);
					expect(collider.tags).toHaveLength(2);
					expect(collider.tags).not.toContain(tag);
				});
			});
		});
	});
});
