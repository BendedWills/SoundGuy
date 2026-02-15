export function getFirstWord(str)
{
    return str.split(" ")[0];
}

export function getFilenameFromInput(input)
{
    for (let i = 0; i < input.length; i++) 
    {
     	if (input.charAt(i) === ' ' && i < input.length - 1)
            return input.substr(i + 1);
    }
    
    return null;
}