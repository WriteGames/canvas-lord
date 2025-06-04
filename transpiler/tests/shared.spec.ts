import { describe, expect, test } from 'vitest';
import {
	getComponentFromFile,
	getFileImports,
	type ImportData,
	readTSFile,
	vitestOnly,
} from '../shared';

import {
	testComponentMock,
	horizontalMovementComponentMock,
	moveLeftSystemMock,
	moveRightSystemMock,
	deleteSelfSystemMock,
} from './mocks';

const testFile = './in/test.ts';

function expectImports(imports: ImportData[]) {
	expect(imports).toHaveLength(3);

	let i = 0;

	expect(imports[i++]).toMatchObject({
		moduleSpecifier: 'canvas-lord',
		namedImports: ['Entity', 'Input', 'Keys'],
	});

	expect(imports[i++]).toMatchObject({
		moduleSpecifier: 'canvas-lord/util/components',
		namedImports: [],
		namespaceImport: '* as Components',
	});

	expect(imports[i++]).toMatchObject({
		moduleSpecifier: 'canvas-lord/util/types',
		namedImports: ['IEntitySystem'],
	});

	expect(i).toEqual(imports.length);
}

test('getFileImports()', () => {
	const imports = getFileImports(testFile);
	expectImports(imports);
});

test('readTSFile()', () => {
	const data = readTSFile(testFile);
	// TODO(bret): better check for this?
	expect(data.sourceFile).toBeDefined();

	expectImports(data.imports);
	expect(data.components).toMatchObject([
		horizontalMovementComponentMock,
		testComponentMock,
	]);

	expect(data.systems).toMatchObject([
		moveLeftSystemMock,
		moveRightSystemMock,
		deleteSelfSystemMock,
	]);
});

describe('getComponentFromFile()', () => {
	test('horizontalMovementComponent', () => {
		const component = getComponentFromFile(
			testFile,
			'horizontalMovementComponent',
		);
		expect(component).toMatchObject(horizontalMovementComponentMock);
	});

	test('horizontalMovementComponent', () => {
		const component = getComponentFromFile(testFile, 'testComponent');
		expect(component).toMatchObject(testComponentMock);
	});
});

describe('getComponentProperties()', () => {
	test('get multiple properties', () => {
		const data = readTSFile(testFile);
		const properties = vitestOnly.getComponentProperties(
			data,
			'testComponent',
		);
		expect(properties).toMatchObject(testComponentMock.properties);
	});

	test('empty component', () => {
		const data = readTSFile(testFile);
		const properties = vitestOnly.getComponentProperties(
			data,
			'horizontalMovementComponent',
		);
		expect(properties).toMatchObject(
			horizontalMovementComponentMock.properties,
		);
	});
});
