"use strict";

const codeEditions = ['318-14']

const __globalDefaults = {
	lightweightConcrete: false,
	epoxyCoatedRebar: false,
	epoxyCoverSatisfied: false,
	hookedCoverSatisfied: false,
	hookedConfinementSatisfied: false,
	compressionConfinementSatisfied: false,
	codeEdition: '318-14',
	isMetric: false,
	preset: 'imperial',
	roundBy: 1
}

const __presetDefaults = {
	"imperial": {
		rebarList: [
			['#3', 0.375],
			['#4', 0.500],
			['#5', 0.625],
			['#6', 0.750],
			['#7', 0.875],
			['#8', 1.000],
			['#9', 1.128],
			['#10', 1.270],
			['#11', 1.410],
			['#14', 1.693],
			['#18', 2.257]
		],
		fy: 60000,
		fc: 4000,
	},
	"softMetric": {
		rebarList: [
			['No.10', 9.52],
			['No.13', 12.7],
			['No.16', 15.8],
			['No.19', 19.05],
			['No.22', 22.225],
			['No.25', 25.4],
			['No.29', 28.65],
			['No.32', 32.25],
			['No.36', 35.81],
			['No.43', 43.0],
			['No.57', 57.33]
		],
		fy: 420,
		fc: 30,
		isMetric: true
	},
	"hardMetric": {
		rebarList: [
			['8', 8],
			['10', 10],
			['12', 12],
			['14', 14],
			['16', 16],
			['20', 20],
			['25', 25],
			['28', 28],
			['32', 32],
			['40', 40],
			['50', 50]
		],
		fy: 420,
		fc: 30,
		isMetric: true
	}
}

/**
 * 
 */
class RebarLapLengthTable {
	constructor(args = {}) {
		let globalSettings = __globalDefaults
		let preset = globalSettings.preset
		let presetSettings = __presetDefaults[preset]
		if ('preset' in args) {
			preset = args.preset
			if (preset in __presetDefaults) { 
				presetSettings = __presetDefaults[preset]
			} else {
				throw new Error('Preset undefined')
			}
		}
		if ('codeEdition' in args) {
			if (!(args.codeEdition in codeEditions)) {
				throw new Error('Code edition not recognized or supported')
			}
		}
		
		Object.assign(this, globalSettings, presetSettings, args)
	}

	/**
	 * Returns sqrt of f`c with limitations per:
	 * 	ACI 318-14 25.4.1.4
	 * @returns {number} sqrt(fc) with max limitation set per 25.4.1.4
	 */
	calcSqrtFc() {

		if (this.isMetric == true) {
			return Math.min(8.3, Math.sqrt(this.fc))
		} else {
			return Math.min(100, Math.sqrt(this.fc))
		}
	}

	/**
	 * Copmutes lambda factor in accordance with:
	 * 	ACI 318-14 Table 25.4.2.3
	 * @returns {number} ligthweight concrete modification factor, lambda
	 */
	calcLambdaFactor() {
		return (this.lightweightConcrete)? 0.75 : 1.0
	}

	/**
	 * Computes epoxy factor in accordance with:
	 * 	ACI 318-14 Table 25.4.2.3
	 * @returns {number} epoxy modification factor, psi_e
	 */
	calcEpoxyFactor() {
		if (this.epoxyCoatedRebar == true) {
			return (this.epoxyCoverSatisfied)? 1.2 : 1.5
		} else return 1.0
	}

	/**
	 * Computes size factor in accordance with:
	 * 	ACI 318-14 Table 25.4.2.3
	 * @param {number} db rebar diameter
	 * @returns {number} Size modification factor, psi_s
	 */
	calcSizeFactor(db) {
		if (this.isMetric == true)
		{
			return (db >= 22)? 1.0 : 0.8
		} else {
			return (db >= 0.875)? 1.0 : 0.8
		}
	}

	/**
	 * Computes casting position factor in accordance with:
	 * 	ACI 318-14 Table 25.4.2.3
	 * @param {boolean} isTop Does bar placement meet "top" definition?
	 * @returns {number} Casting position modification factor, psi_t
	 */
	calcPositionFactor(isTop) {
		return (isTop)? 1.3 : 1.0
	}

	/**
	 * Computes combined epoxy and position factors based on
	 * allowable 1.7 maximum combined value in accordance with:
	 * 	ACI 318-14 Table 25.4.2.3
	 * @param {boolean} isTop
	 * @returns {number} Combined epoxy and casting position modification factors, psi_e * psi_t
	 */
	calcCombinedPositionAndEpoxyFactors(isTop) {
		let epoxyFactor = this.calcEpoxyFactor()
		let positionFactor = this.calcPositionFactor(isTop)
		return Math.min(1.7, epoxyFactor * positionFactor)
	}

	/**
	 * Computes lambda factor for hooked bars in accordance with:
	 * 	ACI 318-14 Table 25.4.3.2
	 * @returns {number} lightweight concrete modification factor, lambda
	 */
	calcHookedLambdaFactor() {
		return (this.lightweightConcrete)? 0.75 : 1.0
	}

	/**
	 * Computes epoxy factor for hooked bars in accordance with:
	 * 	ACI 318-14 Table 25.4.3.2
	 * @returns {number} hooked epoxy modification factor, psi_e
	 */
	calcHookedEpoxyFactor() {
		return (this.epoxyCoatedRebar)? 1.2 : 1.0
	}

	/**
	 * Returns cover factor for hooked bars in accordance with:
	 * 	ACI 318-14 Table 25.4.3.2
	 * @param {number} db bar diameter
	 * @returns {number} hooked cover modification factor, psi_c
	 */
	calcHookedCoverFactor(db) {
		if (this.hookedCoverSatisfied)
		{
			if (this.isMetric) {
				return (db <= 35.81)? 0.7 : 1.0
			} else {
				return (db <= 1.41)? 0.7 : 1.0
			}
		} else return 1.0
	}

	/**
	 * Returns confinement factor for hooked bars in accordance with:
	 * 	ACI 318-14 Table 25.4.3.2
	 * @param {number} db bar diameter
	 * @returns {number} confining reinforcement modification factor, psi_r 
	 */
	calcHookedConfinementFactor(db) {
		if (this.hookedConfinementSatisfied) {
			if (this.isMetric) {
				return (db <= 35.81) ? 0.8 : 1.0
			} else {
				return (db <= 1.41) ? 0.8 : 1.0
			}
		} else return 1.0
	}

	/**
	 * Computes lambda factor for compression bars in accordance with:
	 * 	ACI 318-14 Table 25.4.9.3
	 * @returns {number} lambda, compression lightweight concrete modification factor
	 */
	calcCompressionLambdaFactor() {
		return (this.lightweightConcrete) ? 0.75 : 1.0
	}

	/**
	 * Computes confinement modification factor for compression bars in accordance with:
	 * 	ACI 318-14 Table 25.4.9.3
	 * @returns {number} psi_r, compression confinement modification factor, lambda
	 */
	calcCompressionConfinementFactor() {
		return (this.compressionConfinementSatisfied) ? 0.75 : 1.0
	}

	/**
	 * Calculated bar development length in accordance with:
	 * 	ACI 318-14 Table 25.4.2.2
	 * 	ACI 318M-14 Table 25.4.2.2
	 * @param {number} db bar diameter
	 * @param {boolean} isTop does bar placement meet "top" definition
	 * @param {boolean} meetsCover does bar meet spacing and cover?
	 * @returns {number} development length, Ld
	 */
	calcDevelopmentLength(db, isTop, meetsCover) {
		let sizeTrigger = (this.isMetric)? 19.05 : 0.75
		var factor
		if (meetsCover)
		{
			if (db <= sizeTrigger)
			{
				factor = (this.isMetric)? 2.1 : 25
			} else {
				factor = (this.isMetric)? 1.7 : 20
			}
		} else {
			if (db <= sizeTrigger) {
				factor = (this.isMetric)? 1.4 : (50/3)
			} else {
				factor = (this.isMetric)? 1.1 : (40/3)
			}
		}

		let psi_p_e = this.calcCombinedPositionAndEpoxyFactors(isTop)
		let lambda = this.calcLambdaFactor()
		let sqrtFc = this.calcSqrtFc()

		return db * this.fy * psi_p_e / (factor * lambda * sqrtFc)
	}

	/**
	 * Calculates hooked tension development lengths in accordance with:
	 * 	ACI 318-14 25.4.3.1
	 * @param {number} db bar size 
	 */
	calcHookedDevelopmentLength(db) {
		let lambda = this.calcHookedLambdaFactor()
		let psi_e = this.calcHookedEpoxyFactor()
		let psi_c = this.calcHookedCoverFactor(db)
		let psi_r = this.calcHookedConfinementFactor(db)
		let sqrtFc = this.calcSqrtFc()
		let factor = (this.isMetric)? (1/0.24) : 50
		let minValue = (this.isMetric)? Math.max(150, 8*db) : Math.max(6, 8*db)
		let ldh = this.fy * db * psi_e * psi_c * psi_r / (factor * lambda * sqrtFc)

		return Math.max(minValue, ldh)

	}

	calcCompressionDevelopmentLength(db) {
		let lambda = this.calcCompressionLambdaFactor()
		let psi_r = this.calcCompressionConfinementFactor()
		let sqrtFc = this.calcSqrtFc()
		let minValue = (this.isMetric)? 200 : 8
		let factor1 = (this.isMetric)? (1/0.24) : 50
		let factor2 = (this.isMetric)? 0.043 : 0.0003

		let ldc = Math.max(this.fy * psi_r * db / (factor1 * lambda * sqrtFc), factor2 * this.fy * psi_r * db)
		return Math.max(ldc, minValue)
	}

	calcCompressionSpliceLength(db) {
		let cutoff = (this.isMetric)? 36 : 1.41
		
		let minValue = (this.isMetric)? 300 : 12
		let factor
		if (this.isMetric) {
			factor = (this.fy <= 420)? 0.071*this.fy : (0.13*this.fy - 24)
		} else {
			factor = (this.fy <= 60000)? 0.0005 * this.fy : (0.0009*this.fy - 24)
		}

		let increaseFactorCutoff = (this.isMetric) ? 21 : 3000
		let increaseFactor = (this.fc < increaseFactorCutoff)? 1.33 : 1.0

		let lbc = Math.max(factor * db, minValue) * increaseFactor
		return (db > cutoff)? null : lbc
	}

	/**
	 * Helper function to round up numbers by set value
	 * @param {number} number
	 * @param {number} by increment to round up to (ex. 5 rounds up to next multiple of 5)
	 * @returns {number} rounded number 
	 */
	roundUpTo(number, by = this.roundBy) {
		return Math.ceil((number) / by) * by
	}

	getTable()
	{
		rows = []
		for (row in this.rebarList)
		{
			name = row[0]
			db = row[1]

			rows.push({
				barSize: name,
				db: db,
				area: Math.PI * db^2 / 4,
				tensionTop: {
					Ldt: {
						meetsCover: this.roundUpTo(this.calcDevelopmentLength(db, true, true)),
						doesNotMeetCover: this.roundUpTo(this.calcDevelopmentLength(db, true, false))
					},
					Lbt: {
						meetsCover: this.roundUpTo(1.3*this.calcDevelopmentLength(db, true, true)),
						doesNotMeetCover: this.roundUpTo(1.3*this.calcDevelopmentLength(db, true, false))
					}
				},
				tensionOther: {
					Ld: {
						meetsCover: this.roundUpTo(this.calcDevelopmentLength(db, false, true)),
						doesNotMeetCover: this.roundUpTo(this.calcDevelopmentLength(db, false, false))
					},
					Lb: {
						meetsCover: this.roundUpTo(1.3*this.calcDevelopmentLength(db, false, true)),
						doesNotMeetCover: this.roundUpTo(1.3*this.calcDevelopmentLength(db, false, false))
					}
				},
				compression: {
					Ldc: this.calcCompressionDevelopmentLength(db),
					Lbc: this.calcCompressionSpliceLength(db)
				},
				tensionHook: {
					Ldh: this.calcHookedDevelopmentLength(db)
				}
			})
		}

		return rows
	}
}

module.exports = RebarLapLengthTable