import {GemstoneInput} from './GemstoneInput';
import type {Variant} from '../../shared/domain';

const fields={
  gem:['type','shape','sizeMm','carat','caratEquivalent','totalCaratWeight','count','color','clarity','cutGrade','certificationType','certificateReference'],
  metal:['metal','purity','finish','plating','color'],
  measurements:['widthMm','thicknessMm','chainWidthMm','stoneDiameterMm','necklaceLengthCm','braceletLengthCm','ringSize','earringDimensions','weightGrams','clasp','setting']
} as const;

export function VariantFacts({variant,onChange}:{variant:Variant;onChange:(v:Variant)=>void}) {
  return <details><summary>Variant specifications</summary><p>Empty fields inherit the product specification. Set only confirmed facts for this selection.</p>
    {(['gem','metal','measurements'] as const).map(group=><section key={group}><h4>{group}</h4><div className="two-col">
      {fields[group].map(key=>{
        const numeric=/Mm$|Cm$|Grams$|carat|Carat|^count$/.test(key);
        const values=variant[group] as Record<string,string|number|boolean>;
        if(group==='gem'&&key==='type')return <GemstoneInput key={key} value={variant.gem.type||''} onChange={type=>{const gem={...variant.gem};if(type)gem.type=type;else delete gem.type;onChange({...variant,gem})}}/>;
        return <label className="field" key={key}><span>{key}</span><input value={String(values[key]??'')} type={numeric?'number':'text'} min={numeric?0:undefined} step={numeric?'any':undefined} onChange={e=>{
          const next={...values};if(e.target.value==='')delete next[key];else next[key]=numeric?Number(e.target.value):e.target.value;
          onChange({...variant,[group]:next});
        }}/></label>;
      })}
    </div></section>)}
    <label className="field"><span>Certification included</span><select value={variant.gem.certificationIncluded===undefined?'inherit':String(variant.gem.certificationIncluded)} onChange={e=>{const gem={...variant.gem};if(e.target.value==='inherit')delete gem.certificationIncluded;else gem.certificationIncluded=e.target.value==='true';onChange({...variant,gem})}}><option value="inherit">Inherit from product</option><option value="true">Confirmed included</option><option value="false">Not included</option></select></label>
  </details>;
}
