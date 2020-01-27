LapLengthTable = require('./')

test('Verify default settings', () => {
	table = new LapLengthTable({
		fc: 6000,
		preset: 'imperial'
	})
	expect(table.fy).toEqual(60000)
	expect(table.rebarList[0][0]).toEqual('#3')
	expect(table.codeEdition).toEqual('318-14')

	table = new LapLengthTable({
		fc: 4000
	})
	expect(table.preset).toEqual('imperial')
	expect(table.fy).toEqual(60000)
	expect(table.rebarList[0][0]).toEqual('#3')
	expect(table.codeEdition).toEqual('318-14')
})

test('Check code edition validation', () => {
	expect(() => {
		table = new LapLengthTable({
			codeEdition: 'BadCode'
		})
	}).toThrow()
})

test('Check preset loading', () => {
	expect(() => {
		table = new LapLengthTable({
			preset: 'Australia'
		})
	}).toThrow()

	table = new LapLengthTable({
		preset: 'softMetric'
	})
	expect(table.rebarList[0][0]).toEqual('No.10')

	table = new LapLengthTable({
		preset: 'hardMetric'
	})
	expect(table.rebarList[0][0]).toEqual('8')
})

test('Check code edition validation', () => {
	table = new LapLengthTable({
		codeEdition: '318-14'
	})
	expect(() => {
		table = new LapLengthTable({
			codeEdition: '318-14'
		})
	}).not.toThrow()
	expect(() => {
		table = new LapLengthTable({
			codeEdition: 'RandomCode'
		})
	}).toThrow()
})

test('Check rounding helper function', () => {
	table = new LapLengthTable()
	// first check with default settings
	expect(table.roundUpTo(20.4)).toEqual(21)
	expect(table.roundUpTo(20.0)).toEqual(20)
	// test other rounding mutliples
	expect(table.roundUpTo(22, 5)).toEqual(25)
	expect(table.roundUpTo(21.7, 10)).toEqual(30)
})

test('Check sqrt(fc) helper function', () => {
	table = new LapLengthTable({
		fc: 4000
	});
	expect(table.calcSqrtFc()).toBeCloseTo(63.2, 1)
	
	table = new LapLengthTable({
		fc: 6000
	});
	expect(table.calcSqrtFc()).toBeCloseTo(77.5, 1)

	table = new LapLengthTable({
		fc: 12000
	});
	expect(table.calcSqrtFc()).toEqual(100) // based on code limit

	// metric checks
	table = new LapLengthTable({
		fc: 30,
		isMetric: true
	})
	expect(table.calcSqrtFc()).toBeCloseTo(5.5, 1)

	table = new LapLengthTable({
		fc: 50,
		isMetric: true
	})
	expect(table.calcSqrtFc()).toBeCloseTo(7.1, 1)

	table = new LapLengthTable({
		fc: 82,
		isMetric: true
	})
	expect(table.calcSqrtFc()).toEqual(8.3)
})

test('Check lambda factor calculations', () => {
	table = new LapLengthTable({
		lightweightConcrete: false
	})
	expect(table.calcLambdaFactor()).toEqual(1.0)

	table = new LapLengthTable({
		lightweightConcrete: true
	})
	expect(table.calcLambdaFactor()).toEqual(0.75)
})

test('check Epoxy-coated factor calculations', () => {
	table = new LapLengthTable({
		epoxyCoatedRebar: false,
		epoxyCoverSatisfied: false
	})
	expect(table.calcEpoxyFactor()).toEqual(1.0)

	table = new LapLengthTable({
		epoxyCoatedRebar: true,
		epoxyCoverSatisfied: false
	})
	expect(table.calcEpoxyFactor()).toEqual(1.5)

	table = new LapLengthTable({
		epoxyCoatedRebar: true, 
		epoxyCoverSatisfied: true})
	expect(table.calcEpoxyFactor()).toEqual(1.2)

	table = new LapLengthTable({
		epoxyCoatedRebar: false,
		epoxyCoverSatisfied: true})
	expect(table.calcEpoxyFactor()).toEqual(1.0)
})

test('Check size modification factor calculations', () => {
	table = new LapLengthTable({
		isMetric: false
	})
	expect(table.calcSizeFactor(0.5)).toEqual(0.8)
	expect(table.calcSizeFactor(0.75)).toEqual(0.8)
	expect(table.calcSizeFactor(0.875)).toEqual(1.0)

	table = new LapLengthTable({
		isMetric: true
	})
	expect(table.calcSizeFactor(10)).toEqual(0.8)
	expect(table.calcSizeFactor(16)).toEqual(0.8)
	expect(table.calcSizeFactor(22)).toEqual(1.0)
})

test('Check position modification factor calculations', () => {
	table = new LapLengthTable()
	expect(table.calcPositionFactor(true)).toEqual(1.3)
	expect(table.calcPositionFactor(false)).toEqual(1.0)
})

test('Check combined position and epoxy modification factors calcualation', () => {
	table = new LapLengthTable({
		epoxyCoatedRebar: false,
		epoxyCoverSatisfied: false
	})
	expect(table.calcCombinedPositionAndEpoxyFactors(false)).toEqual(1.0) // 1.0 * 1.0
	expect(table.calcCombinedPositionAndEpoxyFactors(true)).toEqual(1.3) // 1.3 * 1.0

	table = new LapLengthTable({
		epoxyCoatedRebar: true,
		epoxyCoverSatisfied: false
	})
	expect(table.calcCombinedPositionAndEpoxyFactors(false)).toEqual(1.5) // 1.0 * 1.5
	expect(table.calcCombinedPositionAndEpoxyFactors(true)).toEqual(1.7) // 1.3 * 1.5 > 1.7

	table = new LapLengthTable({
		epoxyCoatedRebar: true,
		epoxyCoverSatisfied: true
	})
	expect(table.calcCombinedPositionAndEpoxyFactors(false)).toEqual(1.2) // 1.0 * 1.2
	expect(table.calcCombinedPositionAndEpoxyFactors(true)).toEqual(1.56) // 1.3 * 1.2
})

test('Check hooked lambda factor calculations', () => {
	table = new LapLengthTable({
		lightweightConcrete: false
	})
	expect(table.calcHookedLambdaFactor()).toEqual(1.0)

	table = new LapLengthTable({
		lightweightConcrete: true
	})
	expect(table.calcHookedLambdaFactor()).toEqual(0.75)
})

test('check hooked epoxy-coated factor calculations', () => {
	table = new LapLengthTable({
		epoxyCoatedRebar: false
	})
	expect(table.calcHookedEpoxyFactor()).toEqual(1.0)

	table = new LapLengthTable({
		epoxyCoatedRebar: true
	})
	expect(table.calcHookedEpoxyFactor()).toEqual(1.2)
})

test('check tension development length calculations', () => {

	// fc = 4000 psi, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 4000
	})
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, false, true))).toEqual(19) // #4 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, true, true))).toEqual(25) // #4 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, false, true))).toEqual(48) // #8 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, true, true))).toEqual(62) // #8 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, false, true))).toEqual(81) // #14 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, true, true))).toEqual(105) // #14 top

	// fc = 8000 psi, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 8000
	})
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, false, true))).toEqual(14) // #4 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, true, true))).toEqual(18) // #4 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, false, true))).toEqual(34) // #8 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, true, true))).toEqual(44) // #8 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, false, true))).toEqual(57) // #14 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, true, true))).toEqual(74) // #14 top

	// fc = 8000 psi, fy = 80,000psi, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 8000,
		fy: 80000
	})
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, false, true))).toEqual(18) // #4 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, true, true))).toEqual(24) // #4 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, false, true))).toEqual(45) // #8 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, true, true))).toEqual(59) // #8 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, false, true))).toEqual(76) // #14 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, true, true))).toEqual(99) // #14 top

	// fc = 4000 psi liqhtweight, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 4000,
		lightweightConcrete: true
	})
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, false, true))).toEqual(26) // #4 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, true, true))).toEqual(33) // #4 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, false, true))).toEqual(64) // #8 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, true, true))).toEqual(83) // #8 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, false, true))).toEqual(108) // #14 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, true, true))).toEqual(140) // #14 top

	// fc = 4000 psi epoxy coated rebar without additional clear cover
	table = new LapLengthTable({
		fc: 4000,
		epoxyCoatedRebar: true,
		epoxyCoverSatisfied: false
	})
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, false, true))).toEqual(29) // #4 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, true, true))).toEqual(33) // #4 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, false, true))).toEqual(72) // #8 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, true, true))).toEqual(81) // #8 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, false, true))).toEqual(121) // #14 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, true, true))).toEqual(137) // #14 top

	// fc = 4000 psi epoxy coated rebar additional clear cover satisfied
	table = new LapLengthTable({
		fc: 4000,
		epoxyCoatedRebar: true,
		epoxyCoverSatisfied: true
	})
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, false, true))).toEqual(23) // #4 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(0.5, true, true))).toEqual(30) // #4 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, false, true))).toEqual(57) // #8 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.0, true, true))).toEqual(74) // #8 top
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, false, true))).toEqual(97) // #14 bottom
	expect(table.roundUpTo(table.calcDevelopmentLength(1.693, true, true))).toEqual(126) // #14 top
})

test('check hooked bar tension development length calculations', () => {
	
	// fc = 4000psi, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 4000
	})
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(0.5))).toEqual(10) // #4
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.0))).toEqual(19) // #8
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.693))).toEqual(33) // #14

	// fc = 8000psi, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 8000
	})
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(0.5))).toEqual(7) // #4
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.0))).toEqual(14) // #8
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.693))).toEqual(23) // #14

	// fc = 4000psi, fy = 80,000psi, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 8000,
		fy: 80000
	})
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(0.5))).toEqual(9) // #4
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.0))).toEqual(18) // #8
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.693))).toEqual(31) // #14

	// fc = 4000psi lightweight, non-epoxy coated rebar
	table = new LapLengthTable({
		fc: 4000,
		lightweightConcrete: true
	})
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(0.5))).toEqual(13) // #4
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.0))).toEqual(26) // #8
	expect(table.roundUpTo(table.calcHookedDevelopmentLength(1.693))).toEqual(43) // #14
})

test('check compression lambda factor calculations', () => {
	table = new LapLengthTable({
		lightweightConcrete: false
	})
	expect(table.calcCompressionLambdaFactor()).toEqual(1.0)

	table = new LapLengthTable({
		lightweightConcrete: true
	})
	expect(table.calcCompressionLambdaFactor()).toEqual(0.75)
})

test('check compression confinement factor calculations', () => {
	table = new LapLengthTable({
		compressionConfinementSatisfied: true
	})
	expect(table.calcCompressionConfinementFactor()).toEqual(0.75)

	table = new LapLengthTable({
		compressionConfinementSatisfied: false
	})
	expect(table.calcCompressionConfinementFactor()).toEqual(1.0)
})

test('check compression development length calculations', () => {
	table = new LapLengthTable({
		fc: 4000
	})
	expect(table.roundUpTo(table.calcCompressionDevelopmentLength(0.5))).toEqual(10)
	table = new LapLengthTable({
		fc: 8000
	})
	expect(table.roundUpTo(table.calcCompressionDevelopmentLength(0.5))).toEqual(9)
	table = new LapLengthTable({
		fc: 4000,
		lightweightConcrete: true
	})
	expect(table.roundUpTo(table.calcCompressionDevelopmentLength(0.5))).toEqual(13)
})

test('check compression lap splice length calculations', () => {
	table = new LapLengthTable({
		fy: 60000
	})
	expect(table.roundUpTo(table.calcCompressionSpliceLength(0.5))).toEqual(15)
	table = new LapLengthTable({
		fy: 80000
	})
	expect(table.roundUpTo(table.calcCompressionSpliceLength(0.5))).toEqual(24)
})

test('check cutoff on splice length based on bar size', () => {
	table = new LapLengthTable()
	expect(table.calcSpliceLength(1.693)).toEqual(null)
})