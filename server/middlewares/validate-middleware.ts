import {Request,Response,NextFunction} from "express";

const validate=(schema:any)=>async (req:Request,res:Response,next:NextFunction)=>{

    try {
        const parseBody= await schema.parseAsync(req.body);
        req.body=parseBody;
        next();
    } catch (err:any) {
        console.log(`validate-middleware == ${err}`);
        
        const status=422;
        const message= "Fill in the input properly";
        const extraDetails= err.errors[0].message;

        const erro_middle={status,message,extraDetails}
        next(erro_middle);

/////////////////////////////////////////////////////////////////////////////////////////
// We are using the error_middleware so for error middleware, next(error) have to write in all the places where you to throw some error -----------------

        // res.status(400).send({msg:message});
/////////////////////////////////////////////////////////////////////////////////////////

    }
}

export default validate;