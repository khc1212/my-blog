
# torch.cuda.is_available
- True
- False
> 表示当前有没有显卡，是否激活

# 张量
张量的索引引用和numpy一样
## torch.tensor(1., requires_grid=True)
> requires_grid表示是否对当前参数求导
> 例子：
```python
x = torch.tensor(1.)
a = torch.tensor(1., requires_grid=True)
b = torch.tensor(2., requires_grid=True)
c = torch.tensor(3., requires_grid=True)
y = a**2 * x + b * x + c
# 求偏导结果 2ax  x  1
# 此例 x = 1 所以对应结果 2a 1 1
# 又因为a = 1 所以 2 1 1  如下图所示
pring('before', a.grad, b.grad, c.grad)
grads = autograd.grad(y, [a, b, c] )
print('after', grads[0], grads[1], grads[2])
```
![[Pasted image 20221125091651.png]]
## a.to('cuda')
>将a放入显卡a为tensor

创建张量的同时放入cuda
## x = torch.empty(5, 3, divice='cuda')
- 没有初始化的矩阵,并放入cuda
```python
tensor(1.00000e-04 * 
	   [[-0.0000, 0.0000, 1.5135], 
	   [ 0.0000, 0.0000, 0.0000], 
	   [ 0.0000, 0.0000, 0.0000], 
	   [ 0.0000, 0.0000, 0.0000], 
	   [ 0.0000, 0.0000, 0.0000]])
```

## torch.rand(5, 3)
- 随意随机初始化的矩阵
## tensor类型
![[Pasted image 20221127093114.png]]

## torch.zeros(5, 3, dtype=torch.long)
- 矩阵全为 0，而且数据类型是 long
## tensor改变数据类型
```python
tensor.zeros(10,2).to(torch.double)
```

## torch.tensor([5.5, 3])
- 构造一个张量，直接使用数据
> tensor([ 5.5000,  3.0000])

![[Pasted image 20221125091744.png]]

## 张量维度命名


## 读取3D图形

# 内存函数
参考[pytorch torch.Storage学习 - 慢行厚积 - 博客园 (cnblogs.com)](https://www.cnblogs.com/wanghui-garcia/p/10623033.html)
## tensor.storage()
 pytorch中的一个tensor分为头信息区（Tensor）和存储区（Storage）
 信息区主要保存着tensor的形状（size）、步长（stride）、数据类型（type）等信息。
 而真正的数据则保存成连续数组，存储在存储区。
		主要类似于 tensor为链表节点的指针，storage为此节点指向的数据地址
	![[Pasted image 20221126211012.png]]
## 

## tensor.stride()
官方文档是这样描述的：stride是在指定维度dim中从一个元素跳到下一个元素所必需的步长。当没有参数传入时，返回所有步长的元组。否则，将返回一个整数值作为特定维度dim中的步长

```python
>>> b 
tensor([[0, 1, 2], 
		[3, 9, 5]]) 
>>> b.stride() 
(3, 1) 
>>> b.stride(0) 
3 
>>> b.stride(1) 
1
```
上面的3指的是第0个维度中的一个元素[0, 1, 2]到下一个元素[3, 9, 5]所需要的步长为3，也可以理解从第一个的第一个索引到下一个元素第一个索引跨度是3。而1指的是第1个维度[0, 1, 2]中的一个元素0到下一个元素1所需要的步长为1。
##  torch.storage_offset()
返回tensor的第一个元素与storage的第一个元素的偏移量。
```python
>>> b.storage()
 0
 1
 2
 3
 9
 5
[torch.LongStorage of size 6]
>>> b
tensor([[0, 1, 2],
        [3, 9, 5]])
>>> b.storage_offset()
0
```
b的的第一个元素为0，而0是b的storage的第0位，所以偏移量为0。
```python
>>> c.storage()
 0
 1
 2
 3
 9
 5
[torch.LongStorage of size 6]
>>> c
tensor([2, 3, 9, 5])
>>> c.storage_offset()
2
```
c的的第一个元素为2，而2是c的storage的第2位，所以偏移量为2。
# torch.unsqueeze(input, dim, out=None)
- 作用：
	 - 扩展维度
- 注意返回张量与输入张量共享内存，所以改变其中一个的内容会改变另一个
>如果dim为负，则将会被转化dim+input.dim()+1

-   **参数:**
-   `tensor (Tensor)`   输入张量
-   `dim (int)`   插入维度的索引
-   `out (Tensor, optional)`   结果张量
```python
x = torch.tensor([[[1,2,5],

                   [2,5,6]]])

x.shape

Out[8]:

torch.Size([1, 2, 3])

In [13]:

x = torch.unsqueeze(x,0) # 这里返回的是一个新的张量

x.shape

Out[13]:

torch.Size([1, 1, 2, 3])
```

# Tensor.permute
将 tensor的维度换位置。
![[Pasted image 20221129092737.png]]
> 第一维和第二维的维数互换了，permute 常用于训练验证数据时维度位置不同的情况，比如训练时使用[B, C, H, W]而当前张量是[H, W, C]的话，就要先用 unsqueeze(0)加一个维度成[B, H, W, C]，再 permute(0, 3, 1, 2) 变换成[B, C, H, W]，要思考清楚是从哪种变换成哪种，目标类型是[B, C, H, W]，而 permute 的参数对应的是源类型[B, H, W, C]的维度。


# torch.stack()
在`pytorch`中，常见的拼接函数主要是两个，分别是：

1.  `stack()`
2.  `cat()`

# torch.view
改变张量维度

# 内置的网络模型torchvision
在models里，有AlexNet，也有alexnet，其余同理。**首字母大写的名称指的是实现了这些模型的Python类，他们的体系结构不同，即网络结构不同。而首字母小写的名称指的是一些便捷函数，他们返回的是这些类所实例化的模型，但有时候使用不同的参数集。**例如，我们有models.ResNet，这是一个Python类，而对应的有models.resnet，也有models.resnet101.这些是基于ResNet类而创建的函数。如果想用预训练模型的话，要用小写字母开头的，这样才有pretrain等声明。
```python
from torchvision import models
dir(models)
# 设置pretrained=True来下载训练好的模型
# 只是需要模型pretrained默认是False
vgg16 = models.vgg16(pretrained=True)
alexnet = models.alexnet(pretrained=True)
squeezenet = models.squeezenet1_0(pretrained=True)
```
实例
```python
resnet = models.resnet101(pretrained=True)
resnet 
# 数据预处理
from torchvision import transforms 
preprocess = transforms.Compose([ 
	transforms.Resize(256), # 大小 
	transforms.CenterCrop(224), # 中心裁剪 
	# convert a PIL image to tensor (H*W*C) in range [0,255] to a torch.Tensor(C*H*W) in the range [0.0,1.0] 
	transforms.ToTensor(), 
	# Normalized an tensor image with mean and standard deviation 
	transforms.Normalize( 
	# 解释：[0.485, 0.456, 0.406]这一组平均值是从imagenet训练集中抽样算出来的。 
	mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225]) ])
# 读取图片
from PIL import Image
img = Image.open('./code/data/p1ch2/bobby.jpg')
# 图像处理
mg_t = preprocess(img)
# 给数据加维度 必须是四维度的
import torch 
print(img_t.shape) # torch.Size([3, 224, 224]) 
batch_t = torch.unsqueeze(img_t, 0) 
print(batch_t.shape) # torch.Size([1, 3, 224, 224])
# 原因可参见[Pytorch model.eval()的作用](https://link.zhihu.com/?target=https%3A//blog.csdn.net/libaominshouzhang/article/details/119741474)：看不懂
resnet.eval()
''' 可以运行模型了'''

out = resnet(batch_t)
out.shape  # torch.Size([1, 1000])
# 产生了一个1000个分数的二维tensor，下面的步骤就是看，在这1000个数字里哪个数字最大，以及该数字对应的具体类别是什么。
# 读入类别文本文件
with open('./code/data/p1ch2/imagenet_classes.txt') as f:
    labels = [line.strip() for line in f.readlines()]
    
# 对out寻找max，在dim=1上，返回元素和索引：既概率最大
_, index = torch.max(out, 1)
index  # tensor([207])
# 也就是第208个标签，索引为207，通过index[0]访问。我们可以继续用softmax将输出都归一化到[0,1]，再乘以100就可以得到对应的百分置信度：
percentage = torch.nn.functional.softmax(out, dim=1)[0] * 100 labels[index[0]], percentage[index[0]].item() # ('golden retriever', 96.29334259033203)

```
这里后面有一个GAN的
[(10 条消息) PyTorch 如何用torchvision自带的预训练好的模型预测一张图片？ - 知乎 (zhihu.com)](https://www.zhihu.com/question/414632601/answer/2473435134)


# from torchvision import transforms

- 功能：
	 对图片进行一些变换，转换张量之类的

```python
'''  (1)最常用的是Totensor类，作用是把一个PIL/Numpy.ndarray类型的图片转化为tensor类型
	 (2）ToPILImage(object)方法：把一个图片转化为PILImage类型
	（3）Normalize (object)正则化
	（4）Resize(object)：进行尺寸的变换
	（5）CenterCrop（object）：对图片进行中心的裁剪
'''
# transforms.Compose图像预处理包。一般用Compose把多个步骤整合到一起：
'''
transforms.Compose([
    transforms.CenterCrop(10),
    transforms.ToTensor(),
])
'''
from torchvision import transforms
from PIL import Image
#python中的用法->tensor的数据类型
#通过Transforms.ToTensor解决两个问题：transforms该如何使用？为什么我们需要Tensor的数据类型？
#绝对路径：E:\pytorch pycharm\data\train\ants_image\0013035.jpg
#相对路径：data/train/ants_image/0013035.jpg
#注意绝对和相对路径斜杠不一样，绝对路径中需要两个\，添加的一个起转义符的作用,或者在路径前加一个r
img_path="data/train/ants_image/0013035.jpg"
img_path_abs="E:\\pytorch pycharm\\data\\train\\ants_image\\0013035.jpg"
img=Image.open(img_path_abs)
#1、如何使用Transforms：选择其中一个类创建实例对象，调用其中的方法，并添加方法所需要的参数
tensor_trans=transforms.ToTensor()#创建具体的工具：创建ToTensor类的实例对象
tensor_img=tensor_trans(img)#使用工具，输入img,输出tensor_img:传入object，Python自动调用函数返回tensor类型的图片
print(tensor_img)
```
![[Pasted image 20221126102215.png]]
## premote
对张量进行变换

# 读写文件
```python
points = torch.tensor(1,2)
# 写文件
torch.save(points, 'mypoints.t')

with open("mypoints.t",'wb') as f:
	torch.save(points, f)

# 读文件
torch.load('mypoints.t')

with open("mypoints.t", 'rb') as f:
	a = torch.load(f)
```

## h5py
这是个经常用来读写模型，网络的包
一个h5py文件是 “dataset” 和 “group” 二合一的容器。  
1. dataset ——> 可以类比成ndarray，包含了一些数据  
2. group ——>可以类比成字典， 包含了其它 dataset 和 其它 group
 ![[Pasted image 20221127095352.png]]
我们可以把h5py文件类比成“文件夹”，以树形结构存储group和dataset
### 创建h5py文件
可以用来保存张量
```python
import h5py
import numpy as np
 
#创建一个h5py文件
f = h5py.File("mytestfile.hdf5", "w")
#和python打开文件的方式一样，可以有'w',有'a'
 
f.name
#'/'
 
#创建一个dataset
dset = f.create_dataset("mydataset", data=np.random.random((3,3)))
#这样的创建方式就会在根目录f下创建一个dataset，内容为data的内容
 
dset.name
#'/mydataset'
#即dset的绝对路径
f.close()
```
读取图像存入h5py文件中
```python
import os
import numpy as np
import cv2
import h5py

def save_image_to_h5py(path):
    img_list=[]  #初始化
    for dir_image in os.listdir(path):
        #读取文件
        img=cv2.imread(os.path.join(path,dir_image))
        img_list.append(img)  #追加到img_list列表中

    img_np = np.array(img_list)  #转为numpy的ndarray类型

    f = h5py.File('hdf5_file.h5', 'w')  #写入文件
    f['image'] = img_np  #名称为image
    f.close()  #关闭文件

save_image_to_h5py('img_align_celeba')

```
读取h5py文件
```python
import h5py
file=h5py.File('hdf5_file.h5','r')
image = file['image'][0, :, :, :]

# 查看image的形状
image.shape
# (218, 178, 3)

# 查看x['image']形状
image = x['image']
image.shape
# (20000, 218, 178, 3)
```

读取图形
```python
import h5py
file=h5py.File('hdf5_file.h5','r')
image = file['image'][0, :, :, :]

```

# 读取时间序列


# torch.nn

pytorch的网络方面的包


# 定义模型

一个完整的模型训练流程：准备数据 → 定义模型 → 定义损失函数 → 定义优化器 → 训练

## 准备数据

用 `torch.utils.data.DataLoader` 和 `torch.utils.data.Dataset` 来加载数据，拿经典的 CIFAR-10 举例：

```python
import torch
import torchvision
import torchvision.transforms as transforms

# 数据预处理：转张量 + 归一化
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))
])

# 下载训练集
trainset = torchvision.datasets.CIFAR10(
    root='./data', train=True, download=True, transform=transform
)
trainloader = torch.utils.data.DataLoader(
    trainset, batch_size=4, shuffle=True, num_workers=2
)

# 下载测试集
testset = torchvision.datasets.CIFAR10(
    root='./data', train=False, download=True, transform=transform
)
testloader = torch.utils.data.DataLoader(
    testset, batch_size=4, shuffle=False, num_workers=2
)

classes = ('plane', 'car', 'bird', 'cat', 'deer',
           'dog', 'frog', 'horse', 'ship', 'truck')
```

## 定义模型

继承 `nn.Module`，在 `__init__` 里搭层，在 `forward` 里定义前向传播：

```python
import torch.nn as nn
import torch.nn.functional as F

class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 6, 5)
        self.pool = nn.MaxPool2d(2, 2)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)

    def forward(self, x):
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        x = F.relu(self.fc2(x))
        x = self.fc3(x)
        return x

net = Net()
```

## 定义损失函数

分类任务常用 `CrossEntropyLoss`，回归用 `MSELoss`，也可以自己写

```python
criterion = nn.CrossEntropyLoss()
```

## 定义优化器

`SGD` 是最基础的，`Adam` 用得最多

```python
import torch.optim as optim

optimizer = optim.SGD(net.parameters(), lr=0.001, momentum=0.9)
# optimizer = optim.Adam(net.parameters(), lr=0.001)
```

## 定义训练函数

一个 epoch 的训练流程：遍历每个 batch → 前向传播 → 算损失 → 清空梯度 → 反向传播 → 更新参数

```python
def train_one_epoch(epoch):
    running_loss = 0.0
    for i, data in enumerate(trainloader, 0):
        inputs, labels = data

        optimizer.zero_grad()

        outputs = net(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        if i % 2000 == 1999:
            print(f'[{epoch + 1}, {i + 1:5d}] loss: {running_loss / 2000:.3f}')
            running_loss = 0.0
```

## 训练

循环跑多个 epoch 就行

```python
if __name__ == '__main__':
    for epoch in range(10):
        train_one_epoch(epoch)

    print('训练完成')

    # 简单验证一下准确率
    correct = 0
    total = 0
    with torch.no_grad():
        for data in testloader:
            images, labels = data
            outputs = net(images)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()

    print(f'测试集准确率: {100 * correct / total:.2f}%')
```


# nn.model参数

nn.Conv2d 是 PyTorch 中的一个卷积层模块。它具有以下参数：  

-   `in_channels`：输入通道数。
-   `out_channels`：输出通道数。
-   `kernel_size`：卷积核的大小，可以是一个整数或一个元组（高度、宽度）。
-   `stride`：卷积核的步长，可以是一个整数或一个元组（高度、宽度）。默认值为 1。
-   `padding`：在图像边缘周围添加的零填充的数量。可以是一个整数或一个元组（高度、宽度）。默认值为 0。
-   `dilation`：控制卷积核间距的因子。可以是一个整数或一个元组（高度、宽度）。默认值为 1。
-   `groups`：控制输入和输出之间连接模式的因子。默认值为 1。
-   `bias`：一个布尔值，表示是否向输出添加偏置。默认值为 True。

  
例如，创建一个具有 3 个输入通道、64 个输出通道、卷积核大小为 3x3、步长为 1、填充为 1 的 nn.Conv2d 层：  

```python
import torch.nn as nn

conv_layer = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, stride=1, padding=1)
```


# torch.nn.functional.pad
`torch.nn.functional.pad` 函数的功能是在输入张量的边缘填充指定数量的零值元素，以扩展张量的形状。该函数通常用于在卷积和池化等操作之前对数据进行填充，以确保输出具有所需的形状，并且可以处理边界上的像素。  
`pad` 函数的语法如下：  

torch.nn.functional.pad(input, pad, mode='constant', value=0)

  
其中：

-   `input`：输入张量。
-   `pad`：向输入张量边缘添加的零值元素数目。如果 `pad` 是一个整数，则表示在所有维度上添加相同数量的元素。如果 `pad` 是一个元组，则表示在每个维度上添加指定数量的元素。
-   `mode`：填充模式。默认为 `'constant'`，表示填充指定值；还可以选择其他模式，例如 `'reflect'` 和 `'replicate'` 等。
-   `value`：当 `mode` 为 `'constant'` 时，用于填充的数值。

  
以下是一个例子，演示了如何使用 `pad` 函数将一个 $2\times3$ 的输入张量填充到 $4\times5$ 的形状：  

import torch

x = torch.tensor([[1, 2, 3], [4, 5, 6]])

## 在 x 的边缘添加 1 行和 2 列的零值元素
padded_x = torch.nn.functional.pad(x, (0, 2, 1, 0), mode='constant', value=0)

print(padded_x)
## 输出：
```python
 tensor([[0, 0, 0, 0, 0],
        [1, 2, 3, 0, 0],
        [4, 5, 6, 0, 0],
        [0, 0, 0, 0, 0]])
```
  
在上述示例中，`pad` 参数设置为 `(0, 2, 1, 0)`，表示在第一个维度上不添加元素，在第二个维度上添加 2 列元素，在第三个维度上添加 1 行元素。使用 `'constant'` 模式填充，填充值为 `0`。

# 保存和加载模型

有两种方式：保存整个模型 或 只保存参数（推荐后者）

```python
# 只保存参数（推荐）
torch.save(net.state_dict(), 'model.pth')

# 加载参数
net = Net()
net.load_state_dict(torch.load('model.pth'))
net.eval()

# 保存整个模型（不推荐，依赖类定义）
torch.save(net, 'model_full.pth')
net = torch.load('model_full.pth')
```

# 设备管理

写代码时养成好习惯，用 `device` 控制模型和数据在 CPU/GPU 之间切换

```python
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f'使用设备: {device}')

net = Net().to(device)

for inputs, labels in trainloader:
    inputs, labels = inputs.to(device), labels.to(device)
    # 正常训练……
```

# 学习率调整

训练过程中动态调整学习率，常用 `StepLR` 和 `ReduceLROnPlateau`

```python
# 每隔 step_size 个 epoch 缩小为原来的 gamma 倍
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=5, gamma=0.1)

for epoch in range(30):
    train_one_epoch(epoch)
    scheduler.step()

# 当 loss 不再下降时自动调低学习率
scheduler = optim.lr_scheduler.ReduceLROnPlateau(
    optimizer, mode='min', factor=0.1, patience=3
)

for epoch in range(30):
    loss = train_one_epoch(epoch)
    scheduler.step(loss)
```